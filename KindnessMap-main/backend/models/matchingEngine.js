function calculateMatchScore(user, request) {

  let S = 0;
  let D = 0;
  let T = 0;
  let R = user.reputationScore || 50;
  let U = request.urgency || 1;

  // Skill Match
  if (
    user.skills &&
    user.skills.toLowerCase().includes(
      request.category.toLowerCase()
    )
  ) {
    S = 100;
  }

  // Distance Score
  const distance =
    Math.sqrt(
      Math.pow(user.latitude - request.latitude, 2) +
      Math.pow(user.longitude - request.longitude, 2)
    );

  D = Math.max(0, 100 - distance * 100);

  // Availability
  T = 100;

  const MS =
    (S * 0.35) +
    (D * 0.25) +
    (T * 0.15) +
    (R * 0.15) +
    (U * 10 * 0.10);

  return MS;
}

module.exports = {
  calculateMatchScore
};