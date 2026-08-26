# Specification: Sapo Rive Mascot

## Intent

`Sapo` renders the Rive artboard designed as the public contract of the
mascot: `Artboard`. React controls only the `Main.sapoState` ViewModel enum;
Rive owns the choice and animation of Baby, Kid, and Adult Sapo through its
`artboardProperty`.

## Runtime contract

| Rive element | Exact value | Owner |
|---|---|---|
| Parent artboard | `Artboard` | `Sapo.tsx` mounts it |
| Parent State Machine | `State Machine` | `Sapo.tsx` starts it |
| Default ViewModel | `Main` | Bound automatically |
| State property | `sapoState` | React writes it |
| Enum values | `Idle`, `Success` | Rive transitions consume them |
| Child artboards | `Baby_Sapo`, `Kid_Sapo`, `Adult_Sapo` | Rive selects them through `artboardProperty` |

The child State Machine names (`State Machine` for Baby and `State Machine 1`
for Kid/Adult) are internal to the Rive composition. The app MUST NOT mount
or control those child artboards directly.

## Requirements

### Requirement: Use the parent State Machine with Data Binding

`Sapo` MUST render `Artboard` with `State Machine` and enable automatic
binding to the default ViewModel. It MUST set the enum through the
`sapoState` data-binding path after Rive has loaded.

#### Scenario: Idle mascot

- **Given** `Sapo` receives `estado="idle"`
- **When** the Rive runtime is ready
- **Then** the app sets `sapoState` to `Idle`
- **And** Rive renders the currently bound child Sapo.

### Requirement: Success is controlled by Rive

Only `estado="celebrating"` MUST map to `Success`. `Success` remains active
until React supplies a subsequent non-celebrating state; the app MUST NOT
simulate a finish with a timer or imperative animation callbacks.

#### Scenario: End a celebration

- **Given** `Sapo` has `estado="celebrating"`
- **When** its state changes to `idle`
- **Then** the app sets `sapoState` to `Idle`.

### Requirement: Existing states degrade deliberately

`idle`, `waving`, `happy`, `thinking`, `sad`, and `sleeping` MUST map to
`Idle`. This is intentional until the Rive ViewModel exposes additional enum
values.

### Requirement: Do not bypass Rive's composition

`Sapo` MUST NOT call `play()` with child animation names such as `Jumping`,
`Idle`, `Blinking`, or `Waving tail`. It MUST NOT select the child artboards
from streak state in React.

### Requirement: Preserve the presentation API

The public props `estado`, `tamano`, `animar`, `style`, and `testID` MUST
remain supported. `onFinish` remains present for source compatibility, but is
not invoked because `Success` is a Rive-controlled loop, not a one-shot.

### Requirement: Guard unavailable assets

If the `.riv` asset cannot load, `Sapo` MUST reserve the requested size using
an empty `View` rather than crashing its host screen.
