# Sakura Terminal shell configuration

__sakura_git_branch() {
  local b
  b=$(git symbolic-ref --short -q HEAD 2>/dev/null) || return
  printf ' \001\033[95m\002(%s)\001\033[0m\002' "$b"
}

# VS Code-style colors: user=green, host=cyan, path=yellow, git=pink
PS1='\[\033[32m\]\u\[\033[0m\]@\[\033[36m\]\h\[\033[0m\] \[\033[33m\]\w\[\033[0m\]$(__sakura_git_branch)\n\[\033[1;35m\]❯\[\033[0m\] '

# Useful color aliases
alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias ll='ls -la --color=auto'
