2026-03-06 12:33:40.362 [info] [main] Log level: Info
2026-03-06 12:33:40.362 [info] [main] Validating found git in: "git"
2026-03-06 12:33:40.362 [info] [main] Using git "2.47.2" from "git"
2026-03-06 12:33:40.362 [info] [Model][doInitialScan] Initial repository scan started
2026-03-06 12:33:40.362 [info] > git rev-parse --show-toplevel [557ms]
2026-03-06 12:33:40.362 [info] > git rev-parse --git-dir --git-common-dir [67ms]
2026-03-06 12:33:40.362 [info] [Model][openRepository] Opened repository: /home/user/studio
2026-03-06 12:33:40.365 [info] > git config --get commit.template [19ms]
2026-03-06 12:33:40.378 [info] > git rev-parse --show-toplevel [18ms]
2026-03-06 12:33:40.397 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [21ms]
2026-03-06 12:33:40.399 [info] > git rev-parse --show-toplevel [10ms]
2026-03-06 12:33:40.481 [info] > git status -z -uall [57ms]
2026-03-06 12:33:40.482 [info] > git rev-parse --show-toplevel [73ms]
2026-03-06 12:33:40.509 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [61ms]
2026-03-06 12:33:41.049 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [452ms]
2026-03-06 12:33:41.062 [info] > git rev-parse --show-toplevel [558ms]
2026-03-06 12:33:41.109 [info] > git config --get --local branch.main.vscode-merge-base [46ms]
2026-03-06 12:33:41.110 [warning] [Git][config] git config failed: Failed to execute git
2026-03-06 12:33:41.122 [info] > git config --get commit.template [504ms]
2026-03-06 12:33:41.264 [info] > git rev-parse --show-toplevel [174ms]
2026-03-06 12:33:41.264 [info] [Model][doInitialScan] Initial repository scan completed - repositories (1), closed repositories (0), parent repositories (0), unsafe repositories (0)
2026-03-06 12:33:41.346 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [69ms]
2026-03-06 12:33:41.437 [info] > git status -z -uall [66ms]
2026-03-06 12:33:41.455 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [36ms]
2026-03-06 12:33:41.565 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [64ms]
2026-03-06 12:33:41.680 [info] > git config --get --local branch.main.vscode-merge-base [88ms]
2026-03-06 12:33:41.681 [warning] [Git][config] git config failed: Failed to execute git
2026-03-06 12:33:41.690 [info] > git reflog main --grep-reflog=branch: Created from *. [569ms]
2026-03-06 12:33:41.723 [info] > git check-ignore -v -z --stdin [48ms]
2026-03-06 12:33:41.741 [info] > git symbolic-ref --short refs/remotes/origin/HEAD [27ms]
2026-03-06 12:33:41.741 [info] fatal: ref refs/remotes/origin/HEAD is not a symbolic ref
2026-03-06 12:33:41.741 [warning] [Repository][getDefaultBranch] Failed to get default branch details: Failed to execute git.
2026-03-06 12:33:41.780 [info] > git merge-base refs/heads/main refs/remotes/origin/main [12ms]
2026-03-06 12:33:41.796 [info] > git reflog main --grep-reflog=branch: Created from *. [106ms]
2026-03-06 12:33:41.856 [info] > git diff --name-status -z --diff-filter=ADMR 3402741de8fff028e8ceed0b37d3d205e4c31da7...refs/remotes/origin/main [60ms]
2026-03-06 12:33:41.870 [info] > git symbolic-ref --short refs/remotes/origin/HEAD [52ms]
2026-03-06 12:33:41.870 [info] fatal: ref refs/remotes/origin/HEAD is not a symbolic ref
2026-03-06 12:33:41.870 [warning] [Repository][getDefaultBranch] Failed to get default branch details: Failed to execute git.
2026-03-06 12:33:46.469 [info] > git show --textconv :README.md [313ms]
2026-03-06 12:33:46.651 [info] > git ls-files --stage -- README.md [465ms]
2026-03-06 12:33:46.896 [info] > git cat-file -s cc730c77fac34039b337476709a8fda4652b3a49 [206ms]
2026-03-06 12:34:55.261 [info] > git fetch [453ms]
2026-03-06 12:34:55.292 [info] > git config --get commit.template [11ms]
2026-03-06 12:34:55.295 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [5ms]
2026-03-06 12:34:55.318 [info] > git status -z -uall [14ms]
2026-03-06 12:34:55.319 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [4ms]
2026-03-06 12:34:56.458 [info] > git config --get commit.template [11ms]
2026-03-06 12:34:56.459 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [3ms]
2026-03-06 12:34:56.482 [info] > git status -z -uall [14ms]
2026-03-06 12:34:56.484 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [4ms]
2026-03-06 12:34:56.672 [info] > git ls-files --stage -- README.md [4ms]
2026-03-06 12:34:56.681 [info] > git cat-file -s cc730c77fac34039b337476709a8fda4652b3a49 [3ms]
2026-03-06 12:34:56.840 [info] > git show --textconv :README.md [5ms]
2026-03-06 12:34:57.237 [info] > git log --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z --shortstat --diff-merges=first-parent -n50 --skip=0 --topo-order --decorate=full --stdin [2025ms]
2026-03-06 12:35:00.512 [info] > git log --oneline --cherry main...main@{upstream} -- [5ms]
2026-03-06 12:35:00.861 [info] > git pull --tags origin main [342ms]
2026-03-06 12:35:00.861 [info] From https://github.com/EngAhmedmetwally/ElezzMarket
 * branch            main       -> FETCH_HEAD
 2026-03-06 12:35:01.663 [info] > git push origin main:main [795ms]
 2026-03-06 12:35:01.664 [info] remote: Invalid username or token. Password authentication is not supported for Git operations.
 fatal: Authentication failed for 'https://github.com/EngAhmedmetwally/ElezzMarket.git/'
 2026-03-06 12:35:01.680 [info] > git config --get commit.template [6ms]
 2026-03-06 12:35:01.718 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [13ms]
 2026-03-06 12:35:01.794 [info] > git status -z -uall [26ms]
 2026-03-06 12:35:01.803 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
 2026-03-06 12:35:02.324 [info] > git ls-files --stage -- README.md [3ms]
 2026-03-06 12:35:02.335 [info] > git cat-file -s cc730c77fac34039b337476709a8fda4652b3a49 [3ms]
 2026-03-06 12:35:02.468 [info] > git show --textconv :README.md [4ms]
 2026-03-06 12:35:54.326 [info] > git log --oneline --cherry main...main@{upstream} -- [4ms]
 2026-03-06 12:35:54.782 [info] > git pull --tags origin main [447ms]
 2026-03-06 12:35:54.782 [info] From https://github.com/EngAhmedmetwally/ElezzMarket
  * branch            main       -> FETCH_HEAD
  2026-03-06 12:35:55.624 [info] > git push origin main:main [831ms]
  2026-03-06 12:35:55.624 [info] remote: Invalid username or token. Password authentication is not supported for Git operations.
  fatal: Authentication failed for 'https://github.com/EngAhmedmetwally/ElezzMarket.git/'
  2026-03-06 12:35:55.639 [info] > git config --get commit.template [4ms]
  2026-03-06 12:35:55.650 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [3ms]
  2026-03-06 12:35:55.672 [info] > git status -z -uall [13ms]
  2026-03-06 12:35:55.675 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [4ms]
  2026-03-06 12:35:56.365 [info] > git ls-files --stage -- README.md [3ms]
  2026-03-06 12:35:56.375 [info] > git cat-file -s cc730c77fac34039b337476709a8fda4652b3a49 [3ms]
  2026-03-06 12:35:56.637 [info] > git show --textconv :README.md [4ms]
  2026-03-06 12:36:26.884 [info] > git log --oneline --cherry main...main@{upstream} -- [4ms]
  2026-03-06 12:36:27.331 [info] > git pull --tags origin main [440ms]
  2026-03-06 12:36:27.332 [info] From https://github.com/EngAhmedmetwally/ElezzMarket
   * branch            main       -> FETCH_HEAD
   2026-03-06 12:36:28.110 [info] > git push origin main:main [768ms]
   2026-03-06 12:36:28.110 [info] remote: Invalid username or token. Password authentication is not supported for Git operations.
   fatal: Authentication failed for 'https://github.com/EngAhmedmetwally/ElezzMarket.git/'
   2026-03-06 12:36:28.129 [info] > git config --get commit.template [9ms]
   2026-03-06 12:36:28.132 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) refs/heads/main refs/remotes/main [5ms]
   2026-03-06 12:36:28.153 [info] > git status -z -uall [13ms]
   2026-03-06 12:36:28.154 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [3ms]
   2026-03-06 12:36:28.781 [info] > git ls-files --stage -- README.md [3ms]
   2026-03-06 12:36:28.792 [info] > git cat-file -s cc730c77fac34039b337476709a8fda4652b3a49 [4ms]
   2026-03-06 12:36:28.896 [info] > git show --textconv :README.md [3ms]# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
