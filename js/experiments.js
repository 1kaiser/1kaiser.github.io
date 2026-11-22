const projects = [
  {
    date: '2025-10-07',
    text: 'https://github.com/1kaiser/wordy/raw/main/wordy-demo.gif',
    link: 'https://github.com/1kaiser/wordy',
    demo: 'https://1kaiser.github.io/wordy/'
  },
  {
    date: '2025-10-01',
    text: 'https://raw.githubusercontent.com/1kaiser/TextGraph/master/screenshot_final.png',
    link: 'https://github.com/1kaiser/TextGraph',
    demo: 'https://1kaiser.github.io/TextGraph/'
  },
  {
    date: '2025-07-01',
    text: 'Graph Queen (3D Force Graph & OCR)',
    link: 'https://github.com/1kaiser/graph-queen',
    demo: 'https://1kaiser.github.io/graph-queen/'
  },
  {
    date: '2025-08-29',
    text: 'https://github.com/1kaiser/gemma-chat-app/raw/master/gemma-chat-demo-final.gif',
    link: 'https://github.com/1kaiser/gemma-chat-app',
    demo: 'https://1kaiser.github.io/gemma-chat-app/'
  },
  {
    date: '2025-09-20',
    text: 'LLM Consistency Vis',
    link: 'https://github.com/1kaiser/llm-consistency-vis',
    demo: 'https://1kaiser.github.io/llm-consistency-vis/'
  },
  {
    date: '2025-09-23',
    text: 'https://github.com/1kaiser/llm-wordgraph-exact/raw/master/llm-wordgraph-demo.gif',
    link: 'https://github.com/1kaiser/llm-wordgraph-exact',
    demo: 'https://1kaiser.github.io/llm-wordgraph-exact/'
  }
];

milestones('#timeline')
  .mapping({
    timestamp: 'date',
    text: 'text',
    url: 'link'
  })
  .parseTime('%Y-%m-%d')
  .aggregateBy('month')
  .optimize(true)
  .onEventClick((d) => {
    const targetUrl = (d && (d.demo || d.link || d.url)) || null;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener');
    }
  })
  .render(projects);