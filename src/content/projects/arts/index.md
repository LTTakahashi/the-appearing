---
title: Scoring spoken word recall on a smartwatch
shortName: ARTS
order: 1
feature: true
page: true
figure: arts
figureCaption: A spoken recall becomes a transcript with a confidence for every word. An off-list, uncertain word (dashed) can be rescued from the recognizer’s alternatives; one that stays uncertain is flagged for a person.
kicker: Speech · Wearables
summary: >-
  Older adults said the words they remembered into an Apple Watch, unsupervised, in daily life.
  ARTS scores the recall from Whisper’s word probabilities, not only its top guess, and matched
  two human scorers on held-out participants (ICC .97).
question: Older adults said the words they remembered into an Apple Watch, unsupervised, in daily life. Can a speech recognizer’s own uncertainty make the scoring trustworthy?
role: First author
status: Submitted to JINS · Open source
authors: [L. Takahashi, A. Adam, H. McDougle, M. Jaworski III, B. Minor, M. Calamia, D. J. Cook, M. Schmitter-Edgecombe]
self: L. Takahashi
links:
  - { label: Code, href: "https://github.com/WSU-CASAS/ARTS" }
minute:
  - "**3,443** spoken recalls from **111** adults aged 50 and older, recorded on an Apple Watch across 14 days of daily life."
  - "ARTS scores them from Whisper’s word probabilities, not only its top guess, and flags low-confidence words for a person instead of guessing."
  - "Rules were frozen before testing on 20 people they had never seen: agreement with two human scorings was **ICC .971** and **.968**."
blocks:
  - type: text
    heading: The question
    body: |-
      In the Cognition, Aging and Temperature (CAT) study, adults 50 and older recalled a 12-word list into an Apple Watch, on their own, during 14 days of ordinary life. That produced 3,443 recordings from 111 people, far more than a lab can score by hand.

      Speech recognition can transcribe them, but a misheard word looks exactly like a forgotten one. So the real question is not only how to score automatically, but when an automatic score can be trusted, and what should happen when it can’t.
  - type: text
    heading: The approach
    body: |-
      ARTS works on Whisper transcripts with no fine-tuning, but it reads more than the transcript. Whisper reports how probable each word is and which alternatives it considered. When the word it wrote is off the list and uncertain, ARTS looks at those alternatives; if a list word is among them, it is credited. This is *candidate rescue*.
  - type: steps
    items:
      - { label: 1 · Top guess, text: The written word is off the list and low-confidence }
      - { label: 2 · Alternatives, text: A list word appears among the recognizer’s ranked alternatives }
      - { label: 3 · Decision, text: "Credited, or flagged for a person if it stays uncertain", emphasis: true }
  - type: text
    heading: Rules frozen first
    body: |-
      I developed the scoring rules on 91 participants and then froze them. For a separate group of 20 people the rules had never seen, research assistants followed a blind double-transcription protocol I wrote and coordinated.
  - type: timeline
    stages:
      - { label: Development, text: 91 participants; 602 hand-scored recordings from 14 of them }
      - { label: Then, text: Rules frozen, emphasis: true }
      - { label: Held-out test, text: "20 new participants; 585 recordings, each transcribed blind by two people" }
  - type: text
    heading: Results
    body: |-
      On the 585 held-out recordings, the frozen pipeline agreed with each human scoring of correct recall almost as closely as the two humans agreed with each other.
  - type: stats
    items:
      - { value: ".971", label: ARTS vs. first human scoring (ICC) }
      - { value: ".968", label: ARTS vs. second human scoring (ICC) }
      - { value: ".987", label: The two human scorings vs. each other, muted: true }
      - { value: "0.21", label: words mean absolute difference (0.21–0.22) }
  - type: text
    heading: Limits
    body: |-
      Correct recall is reliable. Repetitions and intrusions are not yet: their agreement stays below ICC .20, so ARTS leaves them to human review rather than reporting a number it can’t stand behind.
citation: "**L. Takahashi**, A. Adam, H. McDougle, M. Jaworski III, B. Minor, M. Calamia, D. J. Cook, M. Schmitter-Edgecombe. Automated scoring of verbal recall in smartwatch-based ecological momentary assessment: development and independent validation. *Journal of the International Neuropsychological Society*, submitted September 2026; decision pending."
---
