class InvalidTradeURLError extends Error {}

class ProfileIsPrivateError extends Error {}

class InventoryQueryRateLimitError extends Error {}

class InvalidWearValueError extends Error {}

class SystemInitNotFinishedError extends Error {}

class InternalError extends Error {}

module.exports = {
  InvalidTradeURLError,
  ProfileIsPrivateError,
  InventoryQueryRateLimitError,
  InvalidWearValueError,
  SystemInitNotFinishedError,
  InternalError
}
