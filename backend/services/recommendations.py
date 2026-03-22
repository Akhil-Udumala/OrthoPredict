from __future__ import annotations

from typing import Any


def build_rehab_tips(payload: dict[str, Any]) -> list[str]:
    tips: list[str] = []

    if payload["nutrition_score"] <= 5:
        tips.append("Increase protein, calcium, and vitamin D intake to support bone healing.")
    if payload["rehab_adherence"] <= 5:
        tips.append("Follow your rehabilitation plan more consistently to improve recovery progress.")
    if payload["smoker"]:
        tips.append("Avoid smoking because it can reduce blood flow and slow fracture healing.")
    if payload["diabetes"]:
        tips.append("Keep blood sugar controlled during recovery to reduce healing delays.")
    if payload["osteoporosis"]:
        tips.append("Discuss bone-strengthening treatment and fall prevention with your clinician.")
    if payload["bmi"] >= 30:
        tips.append("Work with your care team on safe weight management to reduce extra stress on healing bone.")

    fallback_tips = [
        "Attend scheduled follow-up appointments so healing can be monitored on time.",
        "Get enough sleep, hydration, and balanced meals throughout the recovery period.",
        "Avoid putting more weight on the injured bone than your clinician allows.",
    ]

    for tip in fallback_tips:
        if len(tips) >= 3:
            break
        if tip not in tips:
            tips.append(tip)

    return tips[:3]
