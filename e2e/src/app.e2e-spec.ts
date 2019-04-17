import { AppPage } from './app.po';
import { browser, logging } from 'protractor';
import {Log} from '../../src/lib/Log';
import {Data, TestData} from '../../src/lib/Data';
import {Contact} from '../../src/lib/Contact';
import {Public} from '../../src/lib/KeyPair';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', async () => {
    try {
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 250000;
      Log.lvl1('Creating Byzcoin');
      let tdAdmin = await TestData.init(new Data());
      for (let i = 0; i < 100; i++){
        Log.print("reading", i);
        await tdAdmin.cbc.rpc.updateConfig();
      }
      Log.print("createAll")
      await tdAdmin.createAll('admin');
      Log.print("creating contact");
      let reg1 = new Contact(null, Public.fromRand());
      reg1.alias = 'reg1';
      await tdAdmin.d.registerContact(reg1);
      let unreg2 = new Contact(null, Public.fromRand());
      unreg2.alias = 'unreg2';
    } catch (e){
      Log.catch(e);
      throw new Error(e);
    }
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
