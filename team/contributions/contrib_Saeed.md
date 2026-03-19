<img width="690" height="559" alt="Screenshot 2026-03-06 at 8 32 25 PM" src="https://github.com/user-attachments/assets/cd604b49-5204-4a67-b406-402392f6f4da" />

I have contributed to improving the UI since our MVP. For instance, I created the placeholder pages for the calendar, profile, study plan, and upload page according to our classmates feedback. I also created the auth login with google, and I implented the login page and the logout button for our website. I also help implement our start page but as of recently we took it out since it makes more sense for the user flow to just have the upload page to be the first page when they enter the site. I also contributed to linking our project to supabase and creating the supabase project. To add, I helped in fixing security bugs because our google client ids where exposed in our URL> To add, I also created unit tests for the login page process to focus on validating individual components such reset-password, incorrect email, and so forth in isolation, including data validation logic and secure handling of credentials within the code. I also contirbuted on merging and checking over my teammates PRs for when we were planning on training our own model instead of gemini. I also contibuted on working on the upload file page and helping that our csv outputs are correct, however, we are still debugging and working on that issue. Overall, I have helped in creating the frontend compoenents, worked both login and logout features in backend and frontned, debugging and creating tests to ensure security. 

## PRs

| PR | Title | Status | Merged At | Evidence |
| --- | --- | --- | --- | --- |
| [#245](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/245) | adding dropdown menu for proity score | Closed | Not merged | Authored by `saeed-ar`; implements class-priority dropdown work |
| [#244](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/244) | Added Drop down menu to rank classes. | Closed | Not merged directly but implemented in main (teammate used code as reference)  | Authored by `saeed-ar`; implements class-priority dropdown work |
| [#187](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/187) | fixed connection issues and made sure our tokens arent exposed becaus… | Closed | 2026-03-04 19:49:39 UTC | Authored and merged; Google Calendar auth/security hardening |
| [#164](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/164) | Fixingauthlogin | Closed | 2026-02-20 22:34:11 UTC | Authored and merged; auth/login redirect and logout fix |
| [#139](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/139) | Setting up auth login | Closed | 2026-02-19 19:55:29 UTC | Authored and merged; Google Sign-In integration |
| [#128](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/128) | profile page completed demo | Closed | 2026-02-03 07:03:05 UTC | Authored and merged |
| [#124](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/124) | Frontendfix | Closed | 2026-02-07 02:01:09 UTC | Authored and merged |
| [#123](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/123) | Testingpt3 | Closed | 2026-02-07 02:01:10 UTC | Authored and merged |
| [#121](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/121) | Created frontend for profile page | Closed | 2026-02-07 02:01:10 UTC | Authored and merged |
| [#93](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/93) | Frontend skel | Closed | 2026-01-24 05:07:20 UTC | Authored and merged; frontend skeleton and landing page |

## Closed Issues


| Issue | Title | Closed At | Assignees | Evidence |
| --- | --- | --- | --- | --- |
| [#241](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/241) | As a student, I would like to prioritize my classes so it can help me organize and schedule my assignments. | 2026-03-10 07:26:59 UTC | `saeed-ar`, `yzdemo` | Public issue assigned to `saeed-ar`; same feature area as PRs #244 and #245 |
| [#186](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/186) | fix bugs for connecting with google calendar | 2026-03-04 19:49:42 UTC | `saeed-ar` | Closed within seconds of merged PR #187; same Google Calendar fix theme |
| [#185](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/185) | Create tests for logging and api requests | 2026-03-04 19:49:41 UTC | `saeed-ar` | Closed within seconds of merged PR #187; PR #187 mentions security-focused unit tests |
| [#184](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/184) | As a student using Syllabus Calendar, I want Google Calendar auth and sync to be handled securely so my calendar access cannot be leaked. | 2026-03-04 19:49:41 UTC | `saeed-ar` | Closed within seconds of merged PR #187; same auth/security scope |
| [#148](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/148) | As a user, I want the ability to create an account and log-in so that I can save information about myself to the website. | 2026-02-20 22:34:12 UTC | `saeed-ar` | Closed within seconds of merged PR #164; same auth/login scope |
| [#147](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/147) | Have a new working frontend with completed Upload, in-progress Validation, Profile, Calendar Page | 2026-02-14 04:34:32 UTC | `rockygao2020`, `saeed-ar`, `yzdemo` | Public issue assigned to `saeed-ar`; frontend delivery evidence |
| [#135](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/135) | Improved front-end Integration | 2026-02-14 04:56:47 UTC | `rockygao2020`, `saeed-ar`, `yzdemo` | Public issue assigned to `saeed-ar`; frontend integration evidence |
| [#115](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/115) | Integration with Backend/Client ID | 2026-02-07 02:01:10 UTC | `saeed-ar`, `yzdemo` | Closed at the same time as merged PRs #123 and #121 |
| [#96](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/96) | Create Profile Page | 2026-02-07 02:01:11 UTC | `saeed-ar` | Matches authored PR titles #121 and #128 about the profile page |
| [#95](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/95) | As a student, I would like to track the progress of my assignments so that I can stay on top of what's completed and what's still due | 2026-02-13 04:33:57 UTC | `saeed-ar` | Public issue assigned to `saeed-ar` |
| [#88](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/88) | Complete the frontend prototype | 2026-01-24 05:07:22 UTC | `saeed-ar` | Closed within seconds of merged PR #93; same frontend prototype scope |
| [#80](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/80) | Deploy to vercel | 2026-01-24 05:07:22 UTC | `saeed-ar` | Public issue assigned to `saeed-ar` |
| [#79](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/79) | Design Frontend protype - Something that can run on local host with a few buttons. | 2026-01-24 05:07:22 UTC | `saeed-ar` | Closed within seconds of merged PR #93; same frontend skeleton/prototype scope |
| [#57](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/57) | As a student, I want class events to be extracted from my syllabus so that I do not have to write them manually. | 2026-03-10 07:36:54 UTC | `TimatoPaste`, `saeed-ar`, `yzdemo` | Public issue assigned to `saeed-ar`; multi-assignee contribution evidence |

