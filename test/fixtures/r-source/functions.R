# phantom <- function() "comment"
text <- "phantom <- function() 'string'"
ship <- function(order) {
  nested <- function() stop("Nested function must not run")
  nested()
}
increment = \(value) value + 1
`%join%` <- function(left, right) paste(left, right)
wrapped <- identity(function() 1)
holder$method <- function() 1
if (TRUE) conditional <- function() 1
stop("Source must never run during scanning")
