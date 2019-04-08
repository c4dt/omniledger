import {TestBed, async} from '@angular/core/testing';
import {Storage} from './Storage';
import {Log} from './Log';

describe('Storage', () => {
  beforeEach(async () => {
  });

  it('should store and load elements', async () => {
    Storage.set('one', '1');
    expect(Storage.get('one')).toBe('1');
  });

  it('should marshal buffer', async () => {
    let a = {
      one: 1,
      two: Buffer.from('two')
    };
    Storage.putObject("obj", a);
    expect(Storage.getObject("obj")).toEqual(a);
  });
});
