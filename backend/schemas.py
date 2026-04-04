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


class DriverDirection(str, Enum):
    HIGHER = "higher"
    LOWER = "lower"


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


class DriverSignal(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    feature: FeatureName
    effect_weeks: Annotated[float, Field(ge=0.0)]
    direction: DriverDirection

    @field_validator("effect_weeks", mode="before")
    @classmethod
    def validate_effect_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("effect_weeks must be numeric.")
        return float(value)


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    predicted_weeks: Annotated[float, Field(gt=0.0)]
    week_range_low: Annotated[float, Field(ge=0.0)]
    week_range_high: Annotated[float, Field(ge=0.0)]
    category: PredictionCategory
    week_range: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    uncertainty_weeks: Annotated[float, Field(ge=0.0)]
    probabilities: ClassProbabilities
    top_features: Annotated[list[TopFeature], Field(min_length=3, max_length=3)]
    driver_signals: Annotated[list[DriverSignal], Field(min_length=3, max_length=3)]
    rehab_tips: Annotated[list[str], Field(min_length=3, max_length=3)]

    @field_validator(
        "predicted_weeks",
        "week_range_low",
        "week_range_high",
        "confidence",
        "uncertainty_weeks",
        mode="before",
    )
    @classmethod
    def validate_numeric_type(cls, value: object) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("Prediction values must be numeric.")
        return float(value)

    @model_validator(mode="after")
    def validate_response_consistency(self) -> "PredictionResponse":
        derived_category = (
            PredictionCategory.SHORT.value
            if self.predicted_weeks <= 6.0
            else PredictionCategory.MEDIUM.value
            if self.predicted_weeks <= 16.0
            else PredictionCategory.LONG.value
        )
        if derived_category != self.category:
            raise ValueError("category must be derived from predicted_weeks.")

        if not (self.week_range_low <= self.predicted_weeks <= self.week_range_high):
            raise ValueError("predicted_weeks must sit inside the personalized week range.")

        expected_range = f"{self.week_range_low:.1f}-{self.week_range_high:.1f} weeks"
        if self.week_range != expected_range:
            raise ValueError("week_range must match the personalized low/high bounds.")

        max_probability = max(
            self.probabilities.short,
            self.probabilities.medium,
            self.probabilities.long,
        )
        if round(self.confidence, 4) != round(max_probability, 4):
            raise ValueError("confidence must match the highest class probability.")

        expected_uncertainty = round(
            max(
                self.predicted_weeks - self.week_range_low,
                self.week_range_high - self.predicted_weeks,
            ),
            1,
        )
        if round(self.uncertainty_weeks, 1) != expected_uncertainty:
            raise ValueError("uncertainty_weeks must match the personalized week range.")

        return self


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    version: str
    date_trained: str
