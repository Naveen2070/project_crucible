import ansis from 'ansis';
import { pluginRegistry } from '../../plugins/registry';

export interface CompletionOptions {
  /** Hidden mode: print the space-separated component ids the generated scripts complete against. */
  components?: boolean;
}

const SHELLS = ['bash', 'zsh', 'fish'] as const;
type Shell = (typeof SHELLS)[number];

// Top-level commands + aliases offered as first-argument completions.
const COMMANDS =
  'init doctor tokens eject add list ui info status diff update remove clean config completion ' +
  'i d t e a l wizard tui st up rm c cfg';

// Commands (incl. aliases) that take component-name arguments → enable dynamic component completion.
const COMPONENT_COMMANDS = 'add a info remove rm diff update up';

// Common flags surfaced across commands (a superset; harmless if a command ignores one).
const FLAGS =
  '--help --json --cwd --quiet --force --yes --dry-run --framework --style --theme ' +
  '--all --strict --stories --no-stories --verbose --no-update-check --deps-tree';

function bashScript(): string {
  return `# crucible bash completion
_crucible_completion() {
  local cur cmd
  cur="\${COMP_WORDS[COMP_CWORD]}"
  cmd="\${COMP_WORDS[1]}"
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${COMMANDS}" -- "$cur") )
    return
  fi
  if [[ "$cur" == -* ]]; then
    COMPREPLY=( $(compgen -W "${FLAGS}" -- "$cur") )
    return
  fi
  case " ${COMPONENT_COMMANDS} " in
    *" $cmd "*)
      local comps
      comps="$(crucible completion --components 2>/dev/null)"
      COMPREPLY=( $(compgen -W "$comps" -- "$cur") )
      ;;
  esac
}
complete -F _crucible_completion crucible`;
}

function zshScript(): string {
  const componentCase = COMPONENT_COMMANDS.replace(/\s+/g, '|');
  return `#compdef crucible
_crucible() {
  if (( CURRENT == 2 )); then
    compadd -- ${COMMANDS}
    return
  fi
  local cmd=\${words[2]}
  if [[ \${words[CURRENT]} == -* ]]; then
    compadd -- ${FLAGS}
    return
  fi
  case $cmd in
    ${componentCase})
      local comps=("\${(@f)$(crucible completion --components 2>/dev/null)}")
      compadd -- \${=comps}
      ;;
  esac
}
compdef _crucible crucible`;
}

function fishScript(): string {
  const flagLines = FLAGS.trim()
    .split(/\s+/)
    .map((f) => `complete -c crucible -l ${f.replace(/^--/, '')}`)
    .join('\n');
  return `# crucible fish completion
complete -c crucible -f
for c in ${COMMANDS}
  complete -c crucible -n __fish_use_subcommand -a $c
end
complete -c crucible -n '__fish_seen_subcommand_from ${COMPONENT_COMMANDS}' -a '(crucible completion --components 2>/dev/null)'
${flagLines}`;
}

const SCRIPTS: Record<Shell, () => string> = {
  bash: bashScript,
  zsh: zshScript,
  fish: fishScript,
};

/**
 * Print a shell-completion script (bash/zsh/fish), or — in the hidden `--components` mode used by
 * the generated scripts — the list of component ids for dynamic argument completion.
 *
 * The script itself is the only thing written to stdout so it can be sourced/eval'd directly;
 * usage help goes to stderr.
 */
export function runCompletion(shell?: string, opts: CompletionOptions = {}): void {
  if (opts.components) {
    process.stdout.write(pluginRegistry.getAllComponentIds().join(' ') + '\n');
    return;
  }

  if (!shell || !SHELLS.includes(shell as Shell)) {
    console.error(ansis.cyan('Crucible shell completion\n'));
    console.error('Usage: crucible completion <bash|zsh|fish>\n');
    console.error('Install (bash):  crucible completion bash >> ~/.bashrc');
    console.error('Install (zsh):   crucible completion zsh  >> ~/.zshrc');
    console.error(
      'Install (fish):  crucible completion fish > ~/.config/fish/completions/crucible.fish',
    );
    return;
  }

  process.stdout.write(SCRIPTS[shell as Shell]() + '\n');
}
