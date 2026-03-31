import { Command } from 'commander';
import { runExploreCommand } from './commands/explore';
import { runPlanCommand } from './commands/plan';
import { CeeHardwareClient } from '../sdk/cee-client';

const program = new Command();
const cee = new CeeHardwareClient();

program
  .name('cee')
  .description('CEE Agent CLI - Hardware-Accelerated Developer Tooling')
  .version('0.0.1');

program
  .command('explore')
  .description('Explore the codebase and warm the hardware Anchor Bank')
  .argument('[path]', 'path to explore', '.')
  .action(async (path) => {
    await runExploreCommand(path, cee);
  });

program
  .command('plan')
  .description('Design a mission and ground it in the hardware Ghost Tier')
  .argument('<mission>', 'the implementation plan or mission statement')
  .action(async (mission) => {
    await runPlanCommand(mission, cee);
  });

program.parse();
