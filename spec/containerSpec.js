const container = require("../lib/container");
const glob = require("glob");
const memoizeGetters = require("../lib/memoizeGetters");

const definedKeys = {};
Object.keys(container).forEach(key => {
  definedKeys[key] = true;
});

const test = func => {
  const handler = {
    get(target, property, reciever) {
      if (!definedKeys[property]) {
        fail(`No property defined on container: "${property}".`);
      }
      return undefined;
    }
  }
  const containerProxy = new Proxy({}, handler);
  func(containerProxy);
};

describe("container", () => {
  it("has all the properties needed.", () => {
    return new Promise(resolve => {
      glob("lib/**/inject*.js", (err, files) => {
        if (err) {
          fail(err);
        }
        files.forEach(file => {
          const inject = require(`../${file}`);
          test(inject);

          const [filename, match] = file.match(/inject([^/]+).js/);
          const property = `${match[0].toLowerCase()}${match.substring(1)}`;
          if (!definedKeys[property]) {
            fail(`No property defined on container: "${property}"`);
          }
        });
        resolve();
      });
    });
  });

  // this just tests some assumptions made in container.js.
  it("works", () => {
    const injectGreeting = ({ a, b }) => () => {
      return `hello ${a}; goodbye ${b}`;
    }
    const injectFoo = ({ c }) => () => {
      return c;
    }
    let cCalled = false;
    const container = memoizeGetters({
      get a() {
        return "mya"
      },
      get b() {
        return "myb"
      },
      get c() {
        cCalled = true;
        return "myc"
      },
      get greeting() {
        return injectGreeting(this);
      },
      get foo() {
        return injectFoo(this);
      }
    });

    expect(container.greeting()).toEqual("hello mya; goodbye myb");
    expect(cCalled).toBeFalse();
    container.foo;
    expect(cCalled).toBeTrue();
  });

  it("works with returned functions", () => {
    const container = {
      get myfunc() {
        return () => "myfunc";
      }
    };

    const { myfunc } = container;
    expect(myfunc()).toEqual("myfunc");
  });
});