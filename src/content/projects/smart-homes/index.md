---
title: Room-aware tracking in smart homes
shortName: Smart homes
order: 3
feature: true
page: true
figure: homes
figureCaption: A resident’s path through a home, estimated from motion sensors that fire only when someone passes. The shaded ovals show how uncertain each estimate is.
kicker: Ambient sensing · State-space models
summary: >-
  A Kalman filter adapted to event-driven home sensors cut localization error by 18% with
  uncertainty that stayed calibrated (92% consistency vs. 65%). In 35 older adults’ homes, more
  varied days went with better working memory.
question: Motion sensors in a home fire only when someone passes. Can a model track where a person is, and how sure it is, from such sparse events?
role: First author
status: ISG 2026 poster
authors: [L. Takahashi, D. J. Cook, M. Schmitter-Edgecombe]
self: L. Takahashi
links:
  - { label: DOI, href: "https://doi.org/10.4017/gt.2026.25.2.1421.3" }
minute:
  - "A Kalman filter, adapted with a room-aware mechanism, updates only when an ambient sensor fires."
  - "On synthetic residents built from real data, it cut localization error by **18%** against baselines, with uncertainty that was statistically consistent **92%** of the time (65% for baselines)."
  - "In 35 older adults’ homes (2M+ sensor events), higher 1-back accuracy went with more varied days (**r = −.43**, n = 32, p = .015)."
blocks:
  - type: text
    heading: The question
    body: |-
      Ambient sensors are cheap and passive, which makes them attractive for monitoring cognitive health at home. But they report only when something happens, so a model has to estimate where a person is between events, and say how uncertain that estimate is.
  - type: text
    heading: The approach
    body: |-
      I adapted a Kalman filter to event-driven sensor updates, with a room-aware mechanism, so it reports both an estimated position and its uncertainty. LASSO then ranked behavioral features for separating healthy from impaired residents.
  - type: text
    heading: Results
    body: |-
      Against baseline models on the synthetic benchmarks, the filter was more accurate and better calibrated. LASSO-ranked behavioral features separated healthy from impaired simulated residents. In real homes, the variety of a person’s days tracked working memory.
  - type: text
    heading: Limits
    body: |-
      The healthy-versus-impaired comparison uses simulated residents generated from real data, not a clinical sample, and the real-home association is correlational in 32 people.
citation: "**L. Takahashi**, D. J. Cook, M. Schmitter-Edgecombe. Room-aware behavioral profiling for cognitive health monitoring in smart homes. *Gerontechnology* 25(Suppl.), 2026. Poster, ISG 2026, Vancouver. Related manuscript in preparation: *Coupled to time, stuck in space: dissociable behavioral dimensions in MCI and dementia*."
---
