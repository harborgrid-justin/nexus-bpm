
import { LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  action: () => void;
  icon?: LucideIcon;
  shortcut?: string;
  category?: string;
  disabled?: boolean;
}

class CommandService {
  private commands: Map<string, Command> = new Map();
  private listeners: ((commands: Command[]) => void)[] = [];

  register(command: Command) {
    this.commands.set(command.id, command);
    this.notify();
    return () => this.unregister(command.id);
  }

  unregister(id: string) {
    this.commands.delete(id);
    this.notify();
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  execute(id: string) {
    const cmd = this.commands.get(id);
    if (cmd && !cmd.disabled) {
      cmd.action();
    }
  }

  subscribe(listener: (commands: Command[]) => void) {
    this.listeners.push(listener);
    listener(this.getAll());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const all = this.getAll();
    this.listeners.forEach(l => l(all));
  }
}

export const commandService = new CommandService();
