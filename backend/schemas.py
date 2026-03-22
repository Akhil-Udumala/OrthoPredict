from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class FractureType(str, Enum):
    HAIRLINE = "hairline"
    STRESS = "stress"
    SIMPLE = "simple"
    COMPOUND = "compound"
    COMMINUTED = "comminuted"


class BoneAffected(str, Enum):
    FEMUR = "femur"
    TIBIA = "tibia"
    RADIUS = "radius"
    ULNA = "ulna"
    HUMERUS = "humerus"
    CLAVICLE = "clavicle"
    RIB = "rib"
    FOOT = "foot"
    WRIST = "wrist"
    OTHER = "other"


class PredictionCategory(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


class WeekRange(str, Enum):
    SHORT = "0-6 weeks"
    MEDIUM = "6-16 weeks"
    LONG = "16+ weeks"


class FeatureName(str, Enum):
    AGE = "age"
    FRACTURE_TYPE = "fracture_type"
    BONE_AFFECTED = "bone_affected"
    NUTRITION_SCORE = "nutrition_score"
    REHAB_ADHERENCE = "rehab_adherence"
    BMI = "bmi"
    DIABETES = "diabetes"
    OSTEOPOROSIS = "osteoporosis"
    SMOKER = "smoker"


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    age: Annotated[int, Field(strict=True, ge=1, le=110)]
    fracture_type: FractureType
    bone_affected: BoneAffected
    nutrition_score: Annotated[int, Field(strict=True, ge=1, le=10)]
    rehab_adherence: Annotated[int, Field(strict=True, ge=1, le=10)]
    bmi: Annotated[float, Field(ge=10.0, le=60.0)]
    diabetes: Annotated[bool, Field(strict=True)]
    osteoporosis: Annotated[bool, Field(strict=True)]
    smoker: Annotated[bool, Field(strict=True)]

    @field_validator("bmi", mode="before")
    @classmethod
    def validate_bmi_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("bmi must be a number.")
        return float(value)


class ClassProbabilities(BaseModel):
    model_config = ConfigDict(extra="forbid")

    short: Annotated[float, Field(ge=0.0, le=1.0)]
    medium: Annotated[float, Field(ge=0.0, le=1.0)]
    long: Annotated[float, Field(ge=0.0, le=1.0)]

    @field_validator("short", "medium", "long", mode="before")
    @classmethod
    def validate_probability_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("Probability values must be numeric.")
        return float(value)

    @model_validator(mode="after")
    def validate_total(self) -> "ClassProbabilities":
        total = self.short + self.medium + self.long
        if abs(total - 1.0) > 0.01:
            raise ValueError("Probabilities must sum to 1.0 within a tolerance of 0.01.")
        return self


class TopFeature(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    feature: FeatureName
    importance: Annotated[float, Field(ge=0.0, le=1.0)]

    @field_validator("importance", mode="before")
    @classmethod
    def validate_importance_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("Feature importance must be numeric.")
        return float(value)


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    category: PredictionCategory
    week_range: WeekRange
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    probabilities: ClassProbabilities
    top_features: Annotated[list[TopFeature], Field(min_length=3, max_length=3)]
    rehab_tips: Annotated[list[str], Field(min_length=3, max_length=3)]

    @field_validator("confidence", mode="before")
    @classmethod
    def validate_confidence_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("confidence must be numeric.")
        return float(value)

    @model_validator(mode="after")
    def validate_response_consistency(self) -> "PredictionResponse":
        expected_week_ranges = {
            PredictionCategory.SHORT.value: WeekRange.SHORT.value,
            PredictionCategory.MEDIUM.value: WeekRange.MEDIUM.value,
            PredictionCategory.LONG.value: WeekRange.LONG.value,
        }
        if expected_week_ranges[self.category] != self.week_range:
            raise ValueError("week_range does not match the predicted category.")

        max_probability = max(
            self.probabilities.short,
            self.probabilities.medium,
            self.probabilities.long,
        )
        if round(self.confidence, 4) != round(max_probability, 4):
            raise ValueError("confidence must match the highest class probability.")

        return self


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    version: str
    date_trained: str
