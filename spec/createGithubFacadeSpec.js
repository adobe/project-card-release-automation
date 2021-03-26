const createGithubFacade = require("../lib/createGithubFacade");

describe("githubFacade", () => {

  let octokit;
  const owner = "myowner";
  const repo = "myrepo";
  let githubFacade;

  beforeEach(() => {
    octokit = {
      git: jasmine.createSpyObj("octokit.git", ["listMatchingRefs"]),
      request: jasmine.createSpy("octokit.request"),
      issues: jasmine.createSpyObj("octokit.issues", ["create"]),
      projects: jasmine.createSpyObj("octokit.projects", ["listForRepo", "listColumns", "createCard"])
    };
    githubFacade = createGithubFacade({ octokit, owner, repo });
  });

  describe("hasBranch", () => {
    it("calls octokit with the correct params", async () => {
      octokit.git.listMatchingRefs.and.returnValue(Promise.resolve({ data: [] }));
      await githubFacade.hasBranch("mybranch");
      expect(octokit.git.listMatchingRefs).toHaveBeenCalledWith({
        owner, repo, ref: "heads/mybranch", per_page: 1
      });
    });
    it("returns false when no matching refs", async () => {
      octokit.git.listMatchingRefs.and.returnValue(Promise.resolve({ data: [] }));
      expect(await githubFacade.hasBranch("mybranch")).toBeFalse();
    });
    it("returns false when matching ref only starts with branch name", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [{ ref: "refs/heads/mybranch2" }]})
      );
      expect(await githubFacade.hasBranch("mybranch")).toBeFalse();
    });
    it("returns true", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [{ ref: "refs/heads/mybranch" }]})
      );
      expect(await githubFacade.hasBranch("mybranch")).toBeTrue();
    });
  });

  describe("getByUrl", () => {
    it("calls octokit with the url", async () => {
      await githubFacade.getByUrl("myurl");
      expect(octokit.request).toHaveBeenCalledOnceWith("GET myurl");
    });
    it("returns the response", async () => {
      octokit.request.and.returnValue(Promise.resolve("myresponse"));
      expect(await githubFacade.getByUrl("myurl")).toEqual("myresponse");
    });
  });

  describe("createIssue", () => {
    it("calls octokit with the correct parameters", async () => {
      octokit.issues.create.and.returnValue(Promise.resolve({ data: { id: "myid" } }));
      await githubFacade.createIssue({ title: "mytitle", body: "mybody" });
      expect(octokit.issues.create).toHaveBeenCalledOnceWith({
        owner, repo, title: "mytitle", body: "mybody"
      });
    });
    it("returns the new id", async () => {
      octokit.issues.create.and.returnValue(Promise.resolve({ data: { id: "myid" } }));
      expect(await githubFacade.createIssue({ title: "mytitle", body: "mybody" }))
        .toEqual("myid");
    });
  });

  describe("fetchProjectId", () => {
    it("calls octokit with the correct parameters", async () => {
      octokit.projects.listForRepo.and.returnValue(Promise.resolve({
        data: [
          { id: "142", number: 42 }
        ]
      }));
      await githubFacade.fetchProjectId(42);
      expect(octokit.projects.listForRepo).toHaveBeenCalledOnceWith({
        repo, owner, state: "open"
      });
    });
    it("returns the matching project id", async () => {
      octokit.projects.listForRepo.and.returnValue(Promise.resolve({
        data: [
          { id: "101", number: 1 },
          { id: "142", number: 42 },
          { id: "102", number: 2 }
        ]
      }));
      expect(await githubFacade.fetchProjectId(42)).toEqual("142");
    });
    it("throws an error when there is no matching project", async () => {
      octokit.projects.listForRepo.and.returnValue(Promise.resolve({
        data: [
          { id: "101", number: 1 },
          { id: "142", number: 42 },
          { id: "102", number: 2 }
        ]
      }));
      try {
        await githubFacade.fetchProjectId(11);
        fail("Expected an error to be thrown");
      } catch (e) {
        expect(e.message).toEqual("Project with number 11 not found.");
        expect(e.exitCode).not.toEqual(0);
      }
    });
    it("throws an error when there are no open projects", async () => {
      octokit.projects.listForRepo.and.returnValue(Promise.resolve({
        data: []
      }));
      try {
        await githubFacade.fetchProjectId(11);
        fail("Expected an error to be thrown");
      } catch (e) {
        expect(e.message).toEqual("Project with number 11 not found.");
        expect(e.exitCode).not.toEqual(0);
      }
    });
  });

  describe("fetchColumnIdByName", () => {
    it("calls octokit with the correct parameters", async () => {
      octokit.projects.listColumns.and.returnValue(Promise.resolve({ data: [
        { id: "123", name: "foo" }
      ]}));
      await githubFacade.fetchColumnIdByName("myprojectid", "foo");
      expect(octokit.projects.listColumns).toHaveBeenCalledOnceWith({
        project_id: "myprojectid"
      });
    });
    it("returns the found column id", async () => {
      octokit.projects.listColumns.and.returnValue(Promise.resolve({ data: [
        { id: "42", name: "answer" },
        { id: "123", name: "foo" }
      ]}));
      expect(await githubFacade.fetchColumnIdByName("myprojectid", "foo"))
        .toEqual("123");
    });
    it("throws an error if the column isn't found", async () => {
      octokit.projects.listColumns.and.returnValue(Promise.resolve({ data: [
        { id: "42", name: "answer" },
        { id: "123", name: "foo" }
      ]}));
      try {
        await githubFacade.fetchColumnIdByName("myprojectid", "bar");
        fail("Expected an error to be thrown.");
      } catch (e) {
        expect(e.message).toEqual("Could not find project column with name \"bar\".");
        expect(e.exitCode).not.toEqual(0);
      }
    });
    it("throws an error if there are no columns", async () => {
      octokit.projects.listColumns.and.returnValue(Promise.resolve({ data: [] }));
      try {
        await githubFacade.fetchColumnIdByName("myprojectid", "foo");
        fail("Expected an error to be thrown.");
      } catch (e) {
        expect(e.message).toEqual("Could not find project column with name \"foo\".");
        expect(e.exitCode).not.toEqual(0);
      }
    });
  });

  describe("createIssueCard", () => {
    it("calls octokit with the correct params", async () => {
      await githubFacade.createIssueCard("mycolumnid", "myissueid");
      expect(octokit.projects.createCard).toHaveBeenCalledOnceWith({
        column_id: "mycolumnid",
        content_id: "myissueid",
        content_type: "Issue"
      });
    });
  });
});