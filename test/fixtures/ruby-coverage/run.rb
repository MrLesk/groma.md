require_relative "lib/command"
if $PROGRAM_NAME == __FILE__
  Command.new.run
end

