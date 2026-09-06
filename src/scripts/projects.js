import { projects } from '../data/projects.js';

// Cards arrive in the HTML; JavaScript only adds the dialog interaction.
export function getProjectMap() {
    return new Map(projects.map(project => [project.id, project]));
}
