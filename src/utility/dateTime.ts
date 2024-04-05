export function calculateExpirationTime(secondsUntilExpiry: number) {
  const currentDate = new Date();
  const currentUtcTimestamp = currentDate.getTime();

  const expirationUtcTimestamp =
    currentUtcTimestamp + secondsUntilExpiry * 1000;
  const expirationUtcDate = new Date(expirationUtcTimestamp);

  const formattedExpirationTime = expirationUtcDate.toISOString();
  return formattedExpirationTime;
}
