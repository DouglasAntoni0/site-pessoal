import { initModals } from './modals.js';
import { initMotion } from './motion.js';
import { initNavigation } from './navigation.js';
import { renderProjects } from './projects.js';

function bootstrap() {
    const projectMap = renderProjects();
    initNavigation();
    initModals(projectMap);
    initMotion();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
