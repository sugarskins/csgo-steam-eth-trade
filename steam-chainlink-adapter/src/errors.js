class InvalidTradeLinkError extends Error {}

class ProfileIsPrivateError extends Error {}

class InventoryQueryRateLimitError extends Error {}

module.exports = {
  InvalidTradeLinkError,
  ProfileIsPrivateError,
  InventoryQueryRateLimitError
}
