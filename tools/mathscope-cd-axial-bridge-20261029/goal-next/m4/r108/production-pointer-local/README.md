# Local reproduction of the operational launcher overlap

The test serves the exact public version 137 HTTP body locally. The
SHA-256 of the 30,707,818 bytes is
`a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48`.
The desktop center of the editor launcher originally hit the M4 launcher.
The mobile center already hit its own button.

A local stylesheet moves the editor launcher up for widths of 701 px
and greater. Both launchers received pointer clicks and opened and closed
their own dialogs on 390, 701, 768, 1024, 1280 and 1920 px viewports.
The test blocks outbound page requests. Its scope is local pointer and
dialog behavior on the archived HTTP body. Operational network access,
features, current hosted behavior of the fix and release acceptance remain
open. The test made no publishing calls.

Replay with Node.js, the existing Playwright module and Chrome.

    node replay.cjs PRODUCTION_HTTP_SNAPSHOT PLAYWRIGHT_MODULE CHROME OUT

The current evidence package includes the pinned original HTTP snapshot at
`inputs/operational-m4/production-v137.html`.
