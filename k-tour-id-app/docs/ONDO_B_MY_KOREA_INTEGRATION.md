# ONDO B My Korea activity integration

My Korea persists allowlisted references in `ondo-b.device.v1`. It stores canonical venue IDs and the single allowlisted Table ID only. It does not store a Table draft, message, identity value, provider result, visit claim, reservation, or URL state.

The current branch owns three explicit write points:

- `recordRecentVenue` runs only when a person opens a canonical place from Explore, Saved, or a My Korea reference. History traversal and hydration must not call it.
- `recordPlannedTable` runs only after the final local `Confirm join` action. Starting After19, completing After19, cancelling, failing, retrying, or reloading must not create a plan. `removePlannedTable` runs after an explicit leave.
- `markLocalSignalPosted` is the Local Signal contribution-history integration contract. The B-native Local Signal layer calls it exactly once during a successful explicit local submit, and the persisted canonical venue reference drives the contribution list.

Cancel, Person-check return, validation failure, retry entry, and hydration must not call `markLocalSignalPosted`. The merged provider retains the Local Signal draft/boundary state and the My Korea history fields in the same `OndoBDeviceState`, sanitizer, persistence projection, and reset transaction. Draft content and Person-check outcomes remain ephemeral.

`clearBDeviceContent` clears Saved/private notes, recent views, planned Table references, and Local Signal history together while keeping the existing language and completed setup behavior. No backend or provider synchronization is implied.
