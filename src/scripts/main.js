import { initModals } from './modals.js';
import { initMotion } from './motion.js';
import { initNavigation } from './navigation.js';

let projectMapPromise;
function loadProjects() {
    return projectMapPromise ||= import('./projects.js').then(module => module.getProjectMap()).catch(error => {
        projectMapPromise = null;
        throw error;
    });
}

function bootstrap() {
    initNavigation();
    initModals(loadProjects);
    initMotion();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
