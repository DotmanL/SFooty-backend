export function calculateExpirationTime(secondsUntilExpiry: number) {
  const currentDate = new Date();
  const currentUtcTimestamp =
    currentDate.getTime() + currentDate.getTimezoneOffset() * 60 * 1000;
  const currentUtcDate = new Date(currentUtcTimestamp);

  const expirationUtcTimestamp =
    currentUtcDate.getTime() + secondsUntilExpiry * 1000;
  const expirationUtcDate = new Date(expirationUtcTimestamp);

  const formattedExpirationTime = expirationUtcDate.toISOString();
  return formattedExpirationTime;
}
