class InvalidTradeLinkError extends Error {}

class ProfileIsPrivateError extends Error {}

class InventoryQueryRateLimitError extends Error {}

class InvalidWearValueError extends Error {}

class SystemInitNotFinishedError extends Error {}

class InternalError extends Error {}

module.exports = {
  InvalidTradeLinkError,
  ProfileIsPrivateError,
  InventoryQueryRateLimitError,
  InvalidWearValueError,
  SystemInitNotFinishedError,
  InternalError
}
