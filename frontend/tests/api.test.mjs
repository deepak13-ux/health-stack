import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const source = (await readFile(new URL('../src/api/api.js', import.meta.url),'utf8')).replace('import.meta.env.VITE_API_URL','undefined');
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const storage = new Map();
globalThis.sessionStorage = {getItem: k => storage.get(k) ?? null,setItem: (k,v) => storage.set(k,v),removeItem: k => storage.delete(k)};
globalThis.window = {dispatchEvent: () => {}};
const response = (data,status=200) => ({ok:status<400,status,json:async()=>data});

test('three-role login, session restore, errors and logout', async () => {
  let last;
  globalThis.fetch = async (url,options) => { last={url,...options}; return response({token:'token',user:{id:301,role:'pharmacist'}}); };
  await api.login('pharmacist@example.com','secret123','pharmacist');
  assert.equal(last.url,'http://127.0.0.1:8000/auth/login');
  assert.equal(JSON.parse(last.body).role,'pharmacist');
  globalThis.fetch = async (url,options) => { last={url,...options};return response({id:301,role:'pharmacist'}); };
  assert.equal((await api.getSession()).role,'pharmacist');
  assert.equal(last.headers.Authorization,'Bearer token');
  globalThis.fetch = async () => response({detail:'Expired'},401);
  await assert.rejects(api.getSession(),/Expired/);
  assert.equal(await api.getSession(),null);
  globalThis.fetch = async () => {throw new Error('network');};
  await assert.rejects(api.listDoctors(),/Cannot reach/);
  sessionStorage.setItem('careflow.api.token','token');
  await assert.rejects(api.logout(),/Cannot reach/);
  assert.equal(await api.getSession(),null);
});

test('every useful workflow sends the correct request', async () => {
  let last;
  globalThis.fetch = async (url,options) => {last={url,...options};return response([]);};
  for (const [call,method,path] of [
    [api.listDoctors,'GET','/doctors'], [api.listDepartments,'GET','/departments'],
    [() => api.getSlots(101,'2030-01-01'),'GET','/doctors/101/slots?date=2030-01-01'],
    [() => api.bookAppointment({doctorId:101,date:'2030-01-01',time:'09:00'}),'POST','/appointments'],
    [api.listAppointments,'GET','/appointments'],
    [() => api.startAppointment(1),'POST','/appointments/1/start'],
    [api.listMedicines,'GET','/medicines'],
    [() => api.completeAppointment(1,{notes:'Rest',durationDays:7,items:[]}),'POST','/appointments/1/complete'],
    [api.listPrescriptions,'GET','/prescriptions'],[api.listBills,'GET','/bills'],
    [api.getPharmacy,'GET','/pharmacy'],
    [() => api.payBill(1,'Cash'),'POST','/bills/1/payments'],
  ]) {
    await call(); assert.equal(last.method,method); assert.equal(last.url,`http://127.0.0.1:8000${path}`);
  }
  assert.deepEqual(JSON.parse(last.body),{method:'Cash'});
});
