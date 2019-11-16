const vega = require('vega');
const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(500, 500);
const config = data => ({
  background: 'white',
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: 500,
  height: 200,
  padding: 5,

  signals: [
    {
      name: 'interpolate',
      value: 'linear',
      bind: {
        input: 'select',
        options: [
          'basis',
          'cardinal',
          'catmull-rom',
          'linear',
          'monotone',
          'natural',
          'step',
          'step-after',
          'step-before',
        ],
      },
    },
  ],

  data: [
    {
      name: 'table',
      values: data,
    },
  ],

  scales: [
    {
      name: 'x',
      type: 'point',
      range: 'width',
      domain: { data: 'table', field: 'x' },
    },
    {
      name: 'y',
      type: 'linear',
      range: 'height',
      nice: true,
      zero: true,
      domain: { data: 'table', field: 'y' },
    },
    {
      name: 'color',
      type: 'ordinal',
      range: 'category',
      domain: { data: 'table', field: 'c' },
    },
  ],

  axes: [{ orient: 'bottom', scale: 'x' }, { orient: 'left', scale: 'y' }],

  marks: [
    {
      type: 'group',
      from: {
        facet: {
          name: 'series',
          data: 'table',
          groupby: 'c',
        },
      },
      marks: [
        {
          type: 'line',
          from: { data: 'series' },
          encode: {
            enter: {
              x: { scale: 'x', field: 'x' },
              y: { scale: 'y', field: 'y' },
              stroke: { scale: 'color', field: 'c' },
              strokeWidth: { value: 2 },
            },
            update: {
              interpolate: { signal: 'interpolate' },
              fillOpacity: { value: 1 },
            },
            hover: {
              fillOpacity: { value: 0.5 },
            },
          },
        },
      ],
    },
  ],
});

module.exports.plot = (data, title) => {
  var view = new vega.View(vega.parse(config(data)))
    .renderer('none')
    .initialize();
  // generate static PNG file from chart
  view
    .toCanvas()
    .then(function(canvas) {
      // process node-canvas instance for example, generate a PNG stream to write var
      // stream = canvas.createPNGStream();
      console.log('Writing PNG to file...');
      fs.writeFile(`${title}.png`, canvas.toBuffer(), () => {});
    })
    .catch(function(err) {
      console.log('Error writing PNG to file:');
      console.error(err);
    });
};
