const line = `('db0bf0fc-8989-4228-8e5f-e9b0b22a3138', 'a4d5b628-2b94-4258-bb02-a78852f0954f', NULL, 'Standard Rate', '2026-07-30', '2026-07-30', 0, 'Rs', 'per_person', NULL, '2026-05-06T11:15:59.518422+00:00', '2026-05-19T13:21:34.474521+00:00', 0, 0, 0, 0, false, '{"1":{"teen":0,"child":0,"price":21500,"infant":0}}'::jsonb, NULL, 0, 0, 0, 0, 0, '{"1":{"teen":0,"child":0,"price":21500,"infant":0}}'::jsonb, 0, NULL, NULL)`;

const trimmed = line.trim();
const rowStr = trimmed.substring(1, trimmed.length - 1);
const tokens = rowStr.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(t => t.trim());

tokens.forEach((t, idx) => {
  console.log(`${idx}: ${t}`);
});
