const projects = [
  {
    date: '2025-10-07',
    title: 'Wordy',
    img: 'https://github.com/1kaiser/wordy/raw/main/wordy-demo.gif',
    link: 'https://github.com/1kaiser/wordy',
    demo: 'https://1kaiser.github.io/wordy/'
  },
  {
    date: '2025-10-01',
    title: 'TextGraph',
    img: 'https://github.com/1kaiser/TextGraph/raw/master/textgraph-demo-updated.gif',
    link: 'https://github.com/1kaiser/TextGraph',
    demo: 'https://1kaiser.github.io/TextGraph/'
  },
  {
    date: '2025-08-29',
    title: 'Gemma Chat App',
    img: 'https://github.com/1kaiser/gemma-chat-app/raw/master/gemma-chat-demo-final.gif',
    link: 'https://github.com/1kaiser/gemma-chat-app',
    demo: 'https://1kaiser.github.io/gemma-chat-app/'
  },
  {
    date: '2025-09-20',
    title: 'LLM Consistency Vis',
    link: 'https://github.com/1kaiser/llm-consistency-vis'
  },
  {
    date: '2025-09-23',
    title: 'LLM WordGraph Exact',
    img: 'https://github.com/1kaiser/llm-wordgraph-exact/raw/master/llm-wordgraph-demo.gif',
    link: 'https://github.com/1kaiser/llm-wordgraph-exact',
    demo: 'https://1kaiser.github.io/llm-wordgraph-exact/'
  }
];

milestones('#timeline')
  .mapping({
    timestamp: 'date',
    text: 'title'
  })
  .parseTime('%Y-%m-%d')
  .aggregateBy('month')
  .onEventClick((d) => {
    window.open(d.demo, '_blank');
  })
  .renderCallback((d) => {
    d3.selectAll('.milestone')
      .each(function(d) {
        if (d.img) {
          d3.select(this).select('.label').html(`<a href="${d.link}" target="_blank"><img src="${d.img}" /></a>`);
        }
      });
  })
  .render(projects);