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

const createGithubFacade = require("../lib/injectGithubFacade");

describe("githubFacade", () => {
  let octokit;
  const owner = "myowner";
  const repo = "myrepo";
  let fs;
  let githubFacade;

  beforeEach(() => {
    octokit = {
      git: jasmine.createSpyObj("octokit.git", ["listMatchingRefs"]),
      request: jasmine.createSpy("octokit.request"),
      issues: jasmine.createSpyObj("octokit.issues", ["create"]),
      projects: jasmine.createSpyObj("octokit.projects", [
        "listForRepo",
        "listColumns",
        "createCard",
      ]),
      repos: jasmine.createSpyObj("octokit.repos", [
        "getContent",
        "createRelease",
        "uploadReleaseAsset",
      ]),
      actions: jasmine.createSpyObj("octokit.actions", [
        "createWorkflowDispatch",
      ]),
    };
    fs = jasmine.createSpyObj("fs", ["lstat", "readFile"]);
    githubFacade = createGithubFacade({ octokit, owner, repo, fs });
  });

  describe("hasBranch", () => {
    it("calls octokit with the correct params", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [] })
      );
      await githubFacade.hasBranch("mybranch");
      expect(octokit.git.listMatchingRefs).toHaveBeenCalledWith({
        owner,
        repo,
        ref: "heads/mybranch",
        per_page: 1,
      });
    });
    it("returns false when no matching refs", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [] })
      );
      expect(await githubFacade.hasBranch("mybranch")).toBeFalse();
    });
    it("returns false when matching ref only starts with branch name", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [{ ref: "refs/heads/mybranch2" }] })
      );
      expect(await githubFacade.hasBranch("mybranch")).toBeFalse();
    });
    it("returns true", async () => {
      octokit.git.listMatchingRefs.and.returnValue(
        Promise.resolve({ data: [{ ref: "refs/heads/mybranch" }] })
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
      octokit.issues.create.and.returnValue(
        Promise.resolve({ data: { id: "myid" } })
      );
      await githubFacade.createIssue({
        title: "mytitle",
        body: "mybody",
        labels: ["mylabel"],
      });
      expect(octokit.issues.create).toHaveBeenCalledOnceWith({
        owner,
        repo,
        title: "mytitle",
        body: "mybody",
        labels: ["mylabel"],
      });
    });
    it("returns the new id", async () => {
      octokit.issues.create.and.returnValue(
        Promise.resolve({ data: { id: "myid" } })
      );
      expect(
        await githubFacade.createIssue({
          title: "mytitle",
          body: "mybody",
          labels: "mylabel",
        })
      ).toEqual("myid");
    });
  });

  describe("fetchProjectId", () => {
    it("calls octokit with the correct parameters", async () => {
      octokit.projects.listForRepo.and.returnValue(
        Promise.resolve({
          data: [{ id: "142", number: 42 }],
        })
      );
      await githubFacade.fetchProjectId(42);
      expect(octokit.projects.listForRepo).toHaveBeenCalledOnceWith({
        repo,
        owner,
        state: "open",
      });
    });
    it("returns the matching project id", async () => {
      octokit.projects.listForRepo.and.returnValue(
        Promise.resolve({
          data: [
            { id: "101", number: 1 },
            { id: "142", number: 42 },
            { id: "102", number: 2 },
          ],
        })
      );
      expect(await githubFacade.fetchProjectId(42)).toEqual("142");
    });
    it("throws an error when there is no matching project", async () => {
      octokit.projects.listForRepo.and.returnValue(
        Promise.resolve({
          data: [
            { id: "101", number: 1 },
            { id: "142", number: 42 },
            { id: "102", number: 2 },
          ],
        })
      );
      try {
        await githubFacade.fetchProjectId(11);
        fail("Expected an error to be thrown");
      } catch (e) {
        expect(e.message).toEqual("Project with number 11 not found.");
        expect(e.exitCode).not.toEqual(0);
      }
    });
    it("throws an error when there are no open projects", async () => {
      octokit.projects.listForRepo.and.returnValue(
        Promise.resolve({
          data: [],
        })
      );
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
      octokit.projects.listColumns.and.returnValue(
        Promise.resolve({ data: [{ id: "123", name: "foo" }] })
      );
      await githubFacade.fetchColumnIdByName("myprojectid", "foo");
      expect(octokit.projects.listColumns).toHaveBeenCalledOnceWith({
        project_id: "myprojectid",
      });
    });
    it("returns the found column id", async () => {
      octokit.projects.listColumns.and.returnValue(
        Promise.resolve({
          data: [
            { id: "42", name: "answer" },
            { id: "123", name: "foo" },
          ],
        })
      );
      expect(
        await githubFacade.fetchColumnIdByName("myprojectid", "foo")
      ).toEqual("123");
    });
    it("throws an error if the column isn't found", async () => {
      octokit.projects.listColumns.and.returnValue(
        Promise.resolve({
          data: [
            { id: "42", name: "answer" },
            { id: "123", name: "foo" },
          ],
        })
      );
      try {
        await githubFacade.fetchColumnIdByName("myprojectid", "bar");
        fail("Expected an error to be thrown.");
      } catch (e) {
        expect(e.message).toEqual(
          'Could not find project column with name "bar".'
        );
        expect(e.exitCode).not.toEqual(0);
      }
    });
    it("throws an error if there are no columns", async () => {
      octokit.projects.listColumns.and.returnValue(
        Promise.resolve({ data: [] })
      );
      try {
        await githubFacade.fetchColumnIdByName("myprojectid", "foo");
        fail("Expected an error to be thrown.");
      } catch (e) {
        expect(e.message).toEqual(
          'Could not find project column with name "foo".'
        );
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
        content_type: "Issue",
      });
    });
  });

  describe("getPackageVersion", () => {
    const content = `ewogICJuYW1lIjogImFjdGlvbnMtc2FuZGJveCIsCiAgInZlcnNpb24iOiAi
    Mi4xLjAiLAogICJkZXNjcmlwdGlvbiI6ICJyZXBvIHRvIHRlc3QgZ2l0aHVi
    IGFjdGlvbnMiLAogICJtYWluIjogImluZGV4LmpzIiwKICAic2NyaXB0cyI6
    IHsKICAgICJ0ZXN0IjogInRlc3QiCiAgfSwKICAicmVwb3NpdG9yeSI6IHsK
    ICAgICJ0eXBlIjogImdpdCIsCiAgICAidXJsIjogImdpdCtodHRwczovL2dp
    dGh1Yi5jb20vam9uc255ZGVyL2FjdGlvbnMtc2FuZGJveC5naXQiCiAgfSwK
    ICAiYXV0aG9yIjogIiIsCiAgImxpY2Vuc2UiOiAiSVNDIiwKICAiYnVncyI6
    IHsKICAgICJ1cmwiOiAiaHR0cHM6Ly9naXRodWIuY29tL2pvbnNueWRlci9h
    Y3Rpb25zLXNhbmRib3gvaXNzdWVzIgogIH0sCiAgImhvbWVwYWdlIjogImh0
    dHBzOi8vZ2l0aHViLmNvbS9qb25zbnlkZXIvYWN0aW9ucy1zYW5kYm94I3Jl
    YWRtZSIsCiAgImRldkRlcGVuZGVuY2llcyI6IHsKICAgICJAYWN0aW9ucy9n
    aXRodWIiOiAiXjQuMC4wIiwKICAgICJAb2N0b2tpdC9yZXN0IjogIl4xOC4z
    LjUiLAogICAgInNlbXZlciI6ICJeNy4zLjQiCiAgfQp9Cg==
`;
    const encoding = "base64";
    it("gets the package version", async () => {
      octokit.repos.getContent.and.returnValue(
        Promise.resolve({
          data: { content, encoding },
        })
      );
      expect(await githubFacade.getPackageVersion("myref")).toEqual("2.1.0");
      expect(octokit.repos.getContent).toHaveBeenCalledOnceWith({
        owner,
        repo,
        path: "package.json",
        ref: "myref",
      });
    });
  });

  describe("dispatchWorkflow", () => {
    it("creates a workflow dispatch", async () => {
      await githubFacade.dispatchWorkflow("myworkflowid", "myref", {
        version: "myversion",
      });
      expect(octokit.actions.createWorkflowDispatch).toHaveBeenCalledOnceWith({
        owner,
        repo,
        workflow_id: "myworkflowid",
        ref: "myref",
        inputs: { version: "myversion" },
      });
    });
  });

  describe("createRelease", () => {
    it("creates a release", async () => {
      octokit.repos.createRelease.and.returnValue(
        Promise.resolve({ data: {} })
      );
      await githubFacade.createRelease({
        tagName: "mytagname",
        name: "myname",
        body: "mybody",
        prerelease: true,
      });
      expect(
        octokit.repos.createRelease({
          owner,
          repo,
          tag_name: "mytagname",
          name: "myname",
          body: "mybody",
          prerelease: true,
        })
      );
    });
    it("returns the upload_url", async () => {
      octokit.repos.createRelease.and.returnValue(
        Promise.resolve({ data: { upload_url: "myuploadurl" } })
      );
      const uploadUrl = await githubFacade.createRelease({});
      expect(uploadUrl).toEqual("myuploadurl");
    });
  });

  describe("uploadReleaseAsset", () => {
    it("uploads the release asset", async () => {
      fs.lstat.and.returnValue(Promise.resolve({ size: 42 }));
      fs.readFile.and.returnValue(Promise.resolve("myfilecontents"));
      await githubFacade.uploadReleaseAsset("myurl", "./myartifact/myfile.js");
      expect(octokit.repos.uploadReleaseAsset).toHaveBeenCalledOnceWith({
        url: "myurl",
        headers: {
          "content-type": "application/javascript",
          "content-length": 42,
        },
        name: "myfile.js",
        data: "myfilecontents",
      });
    });
  });
});
