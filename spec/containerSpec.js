/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const glob = require("glob");
const container = require("../lib/container");
const memoizeGetters = require("../lib/memoizeGetters");

const definedKeys = {};
Object.keys(container).forEach((key) => {
  definedKeys[key] = true;
});

const test = (func) => {
  const handler = {
    get(target, property) {
      if (!definedKeys[property]) {
        fail(`No property defined on container: "${property}".`);
      }
      return undefined;
    },
  };
  const containerProxy = new Proxy({}, handler);
  func(containerProxy);
};

describe("container", () => {
  it("has all the properties needed.", () =>
    new Promise((resolve) => {
      glob("lib/**/inject*.js", (err, files) => {
        if (err) {
          fail(err);
        }
        files.forEach((file) => {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const inject = require(`../${file}`);
          test(inject);

          const [, match] = file.match(/inject([^/]+).js/);
          const property = `${match[0].toLowerCase()}${match.substring(1)}`;
          if (!definedKeys[property]) {
            fail(`No property defined on container: "${property}"`);
          }
        });
        resolve();
      });
    }));

  // this just tests some assumptions made in container.js.
  it("works", () => {
    const injectGreeting = ({ a, b }) => () => `hello ${a}; goodbye ${b}`;
    const injectFoo = ({ c }) => () => c;
    let cCalled = false;
    const memoizedContainer = memoizeGetters({
      get a() {
        return "mya";
      },
      get b() {
        return "myb";
      },
      get c() {
        cCalled = true;
        return "myc";
      },
      get greeting() {
        return injectGreeting(this);
      },
      get foo() {
        return injectFoo(this);
      },
    });

    expect(memoizedContainer.greeting()).toEqual("hello mya; goodbye myb");
    expect(cCalled).toBeFalse();
    expect(memoizedContainer.foo()).toEqual("myc");
    expect(cCalled).toBeTrue();
  });

  it("works with returned functions", () => {
    const myContainer = {
      get myfunc() {
        return () => "myfunc";
      },
    };

    const { myfunc } = myContainer;
    expect(myfunc()).toEqual("myfunc");
  });
});
