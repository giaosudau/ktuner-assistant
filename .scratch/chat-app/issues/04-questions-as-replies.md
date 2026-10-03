# CA-04 — Owner questions as quick replies

*Blocked by: CA-02*

Owner questions (`reply.questions`) render as chips under the message. Tapping one posts the
choice as a user bubble and calls `/api/answer`; the assistant answers with the updated Next step
(and housing line). An answered question can be changed from the original message.

## Acceptance
- [ ] 23 Aug 20:38 drive → "What changed?" chips → tap "Flashed, MAF Scaling changed" → user bubble + assistant message with the Undo step naming Map version 1.
- [ ] Sidebar "Waiting for you" lists unanswered questions; tapping scrolls to the message.
