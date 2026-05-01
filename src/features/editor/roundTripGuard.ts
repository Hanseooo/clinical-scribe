export interface RoundTripResult {
  ok: boolean;
  input: string;
  output: string;
}

export function checkRoundTrip(input: string, output: string): RoundTripResult {
  const normalizedInput = input.replace(/\r\n/g, '\n').trim();
  const normalizedOutput = output.replace(/\r\n/g, '\n').trim();
  return {
    ok: normalizedInput === normalizedOutput,
    input: normalizedInput,
    output: normalizedOutput,
  };
}
