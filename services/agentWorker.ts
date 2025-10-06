
export const agentWorkerCode = `
  let timer;
  let tasks = []; 
  let settings = {};
  let accounts = [];

  function log(level, msg) { self.postMessage({ type: 'log', level, msg }); }

  function scheduleNextRun() {
    if (timer) clearTimeout(timer);
    
    const activeTasks = tasks.filter(t => t.taskStatus === 'çalışıyor');
    if (activeTasks.length === 0 || settings.status !== 'running') {
        self.postMessage({ type: 'update_next_run', time: null });
        return;
    }
    
    log('info', \`Scheduling checks for \${activeTasks.length} active tasks...\`);
    
    // The worker's job is now to trigger the backend check for each task
    activeTasks.forEach(task => {
        const account = accounts.find(a => a.id === task.accountId);
        if (account) {
            self.postMessage({ type: 'check_backend', task, account });
        } else {
            log('error', \`[\${task.fullName}] No account found for this task. Skipping.\`);
        }
    });
    
    const baseInterval = settings.pollInterval * 1000;
    const jitterValue = (Math.random() * settings.pollJitter * 1000 * 2) - (settings.pollJitter * 1000);
    const nextRun = Math.max(15000, baseInterval + jitterValue); // Minimum 15 seconds
    
    self.postMessage({ type: 'update_next_run', time: Date.now() + nextRun });
    timer = setTimeout(scheduleNextRun, nextRun);
  }

  self.onmessage = (e) => {
    const { command, data } = e.data;
    switch(command) {
        case 'start':
        case 'update':
            tasks = data.tasks;
            accounts = data.accounts;
            settings = data.settings;
            if (settings.status === 'running' && command === 'start') {
                scheduleNextRun();
            } else if (settings.status !== 'running') {
                clearTimeout(timer);
                self.postMessage({ type: 'update_next_run', time: null });
            }
            break;
        case 'stop':
            clearTimeout(timer);
            settings.status = 'stopped';
            self.postMessage({ type: 'update_next_run', time: null });
            break;
    }
  };
`;
