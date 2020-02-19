const TuyAPI = require('tuyapi')
const express = require('express')
const cors =  require('cors')
require('dotenv').config({path: './.env'})

const app = express()
let port = 3000

app.use(cors())

app.listen(process.env.PORT || port, () => {
  console.log('Server listening on port ', process.env.PORT || port)
})

app.get('/setState', async (req, res, next) => {
  let state = (req.query.state == 'true')
  device.set({dps: 20, set: state})
  res.send('OK')
})

app.get('/setColor', async (req, res, next) => {
  let r = Number(req.query.r)
  let g = Number(req.query.g)
  let b = Number(req.query.b)
  let newColor = rgb2tuyaEncoding(r, g, b)
  device.set({dps: 21, set: 'colour'})
  device.set({dps: 24, set: newColor})
  res.send('OK')
})

const device = new TuyAPI({
  id: process.env.deviceID,
  key: process.env.deviceKEY});



/*
DPS:
20: on/off
21: white/colour
22: brightness
23: warmth
25: colour HHHHSSSSBBBB


white color: 000003e803e8
*/
let stateHasChanged = false;

connect()

function connect() {
  // Find device on network
  device.find().then(() => {
    // Connect to device
    device.connect();
  });
}


// Add event listeners
device.on('connected', () => {
  console.log('Connected to device!');
});

device.on('disconnected', () => {
  console.log('Disconnected from device.');
  connect()
});

device.on('error', error => {
  console.log('Error!', error);
});

device.on('data', data => {
  console.log('Data from device:', data);

  if(data.dps == undefined) return

  console.log(`Boolean status of default property: ${data.dps['20']}.`);

  let state = data.dps['20']

  // Set default property to opposite
  if (!stateHasChanged) {
    let newColor = rgb2tuyaEncoding(Math.random()*255, Math.random()*255, Math.random()*255)
    //device.set({dps: 20, set: !state})
    device.set({dps: 21, set: 'colour'})
    device.set({dps: 24, set: newColor})
    //device.set({dps: 23, set: 1000})

    // Otherwise we'll be stuck in an endless
    // loop of toggling the state.
    stateHasChanged = true;

  }
})

function rgb2tuyaEncoding(r, g, b) {
  let hsv = rgb2hsv(r, g, b) 

  let h = Math.round(hsv.h).toString(16)
  while(h.length < 4) h = '0'+h

  let s = Math.round(hsv.s*10).toString(16)
  while(s.length < 4) s = '0'+s

  let v = Math.round(hsv.v*10).toString(16)
  while(v.length < 4) v = '0'+v

  let finalString = h + s + v
  console.log('RGB to Tuya Encoded: ', {r:r,g:g,b:b}, hsv, finalString)
  return finalString
}

function rgb2hsv(r, g, b) {
  let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
  rabs = r / 255;
  gabs = g / 255;
  babs = b / 255;
  v = Math.max(rabs, gabs, babs),
  diff = v - Math.min(rabs, gabs, babs);
  diffc = c => (v - c) / 6 / diff + 1 / 2;
  percentRoundFn = num => Math.round(num * 100) / 100;
  if (diff == 0) {
      h = s = 0;
  } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
          h = bb - gg;
      } else if (gabs === v) {
          h = (1 / 3) + rr - bb;
      } else if (babs === v) {
          h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
          h += 1;
      }else if (h > 1) {
          h -= 1;
      }
  }
  return {
      h: Math.round(h * 360),
      s: percentRoundFn(s * 100),
      v: percentRoundFn(v * 100)
  };
}


// Disconnect after 10 seconds
setTimeout(() => { device.disconnect(); }, 10000);