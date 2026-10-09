unset npm_config_prefix

# Sakura terminal bashrc - colored prompt + proper terminal setup
[ -f /etc/bashrc ] && . /etc/bashrc
[ -f ~/.bashrc ] && . ~/.bashrc


# Starship prompt (VS Code style)

# Directory listings
export LS_COLORS='di=38;5;213:ln=36:so=35:pi=33:ex=32:bd=34;46:cd=34;43:su=41;30:sg=46;30:tw=42;30:ow=43;30:*.tar=31:*.gz=31:*.zip=31:*.jpg=35:*.png=35:*.mp3=35'

alias grep='grep --color=auto'

# Ensure backspace works (set erase char)
stty sane 2>/dev/null || true
eval "$(starship init bash)"

# eza: directories in exact Sakura pink #e679ee

# Show full path as terminal window title too (visible in titlebar)
PROMPT_COMMAND='echo -ne "\033]0;${USER}@${HOSTNAME}: ${PWD}\007"'
# Sakura eza configuration - pink directories
export EZA_COLORS='di=38;2;230;121;238:ln=36:*.tar=31:*.zip=31:*.jpg=38;5;213:ex=32'

alias ls='eza --group-directories-first --no-permissions --no-user --icons'
alias ll='eza -la --group-directories-first --icons --color=always'
alias lt='eza --tree --level=2 --icons'
