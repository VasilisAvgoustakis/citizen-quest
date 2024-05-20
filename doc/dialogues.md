# Dialogues

Dialogues describe interactive conversations between the player and NPCs.

The schema is defined in [dialogues.schema.json](../specs/dialogue.schema.json).

## Dialogue format

Example:

```json
{
  "id": "dialogue_id",
  "items": [
  ]
}
```

A dialogue has two properties:

- **id**: (string) The dialogue's id.
- **items**: (array) An array of node objects.

## Nodes

A dialogue is composed of nodes. Nodes can have different types:

- **statement**: A statement is a node that displays a text and can have responses.
- **random**: A random node is a node that randomly picks one of its items.
- **cycle**: A cycle node is a node that picks the next of its items, in order and starting with 
    the first, when becomes active.
- **sequence**: A sequence node is a node that goes through its items in order.
- **first**: A first node is a node that continues to its first valid item.

When playing a dialogue, there's one active node. A node might transition to another node, but if
there's no transition, the dialogue ends.

All nodes have these properties:

- `id`: (string) The node's id. If it's not set, it's generated automatically.
- `type`: (string, default: 'statement') The node's type. Can be 'statement', 'effect', 'random', 
     'cycle', or 'sequence'.
- `cond` (string, optional): A logical expression (see below).
- `set` (string | array, optional): One or more flags that are set when the node becomes active.

A node can only become active if its `cond` is true. When it becomes active, it
sets all of its `set` flags.

### Statement nodes

Example:

```json
{
  "id": "node_id",
  "type": "statement",
  "cond": "flag1 | (^flag2 & flag3)",
  "text": "Dialogue text",
  "class": ["aClass", "anotherClass"],
  "set": ["flag3", "flag4"],
  "responses": [
    {
      "cond": ["flag5", "flag6"],
      "text": "Response text",
      "class": ["aClass", "anotherClass"],
      "set": ["flag7", "flag8"],
      "thenText": "Text to display after selecting this response",
      "then": "node_id"
    }
  ],
  "then": "node_id"
}
```

Statement nodes have these properties:

- `text` (string | object, required): The text to display.
- `class` (string | array, optional): One or more classes that are set when the text is displayed.
- `responses` (array, optional): An array of response objects.
- `then` (string, optional): The ID of the next node to transition to.

If the statement node has `responses`, they player will have to pick one of them to continue.

The statement node will transition to the next one, decided by the first of these that applies:

- A node specified in the selected response's `then` property.
- A node specified in the statement node's `then` property.
- Back to the parent node.

If there's no transition, the dialogue ends.

#### Responses

A response object has these properties:

- `cond` (string, optional): A logical expression (see below).
- `text` (string | object, required): The text to display.
- `class` (string | array, optional): One or more classes that are set when the response is displayed.
- `set` (string | array, optional): One or more flags that are set when the response is selected.
- `thenText` (string | object, optional): A text that will be displayed after the response is selected.
- `thenClass` (string | array, optional): One or more classes that are set when the `thenText` is displayed.
- `then` (string, optional): The ID of the next node to transition to.

The player is offered all responses that have a `cond` that is true, up to the maximum number.

The player can select only one response, which will set all of its `set` flags.

If the response has a `then` property, the dialogue will transition to the node specified in it, or
display the text as if it were a statement node with no properties other than `text`.

### Effect nodes

Effect nodes are nodes that perform an effect when they become active. They don't display any text.

Example:

```json
{
    "id": "node_id",
    "type": "effect",
    "cond": "flag1 | (^flag2 & flag3)",
    "effect": {
        "type": "effect_type",
        "options": {
            "option1": "value1",
            "option2": "value2"
        }
    },
    "set": ["flag3", "flag4"],
    "then": "node_id"
}
```

They have these properties:

- `effect` (string | object, optional): An effect to perform when the node becomes active (see below).
- `then` (string, optional): The ID of the next node to transition to.

#### Effects

Effects are performed when the node becomes active. They can be used to make all types of visual 
changes to the game. Dialogues don't specify the possible effects, they're offered by the 
game engine and made available to the dialogue interpreter as a sort of runtime environment.

An effect object has these properties:

- `type` (string, required): The type of effect to perform.
- `options` (object, optional): Named arguments for the effect.
- `phase` (string, optional): The phase of the effect to perform. Can be 'start', 'end', or 'all'.

The `phase` property indicates whether to begin and end the effect (`all`) with no nodes in between,
or to `start` the effect ending it after, when a second effect node with the same type and `end` 
in the `phase` property is found.

It might be possible to have more than one effect active at the same time, but only one of each type
can be started. If a second effect node with the same type is found, the first one is terminated
unceremoniously.

##### The Image effect

The image effect displays an image on the screen. The image can be shown between dialogue nodes,
or using separate `start` and `end` phases it can remain on screen throughout a portion of the 
dialogue.

The image effect allows these options:

- `src` (string|object, required): The image to display. Can be a filename string, 
  or an object with language codes as keys and filenames as values. The image will be searched
  in the path specified in the `game.storylineImagePaths` config key.
- `enterAnimationDuration` (number, optional, default: 1000): The duration of the enter animation 
    in milliseconds.
- `exitAnimationDuration` (number, optional, default: 1000): The duration of the exit animation
    in milliseconds.
- `displayDuration` (number, optional, default: 3000): How long the image will be displayed once 
    it entered, in milliseconds.
- `size` (string, optional, default: 'full'): The size of the image on screen. Can be `full` or 
    `dialogue`. choosing `dialogue` sizes the image so it fits between the top and bottom dialogue 
    boxes.

### Collection nodes

Collection nodes are those that have child nodes. Collection nodes transition to one of their
children depending on their specific type.

Children are specified through the `items` property.

- `items` (array, required): An array of node objects.

Collection nodes only consider children with a `cond` property that is true (or no `cond`) when
deciding which one to transition to.

their behavior is defined by their type:

- `sequence`: Go through all of their children in order.
- `first`: Transitions to the first children node.
- `random`: Randomly pick one of their children and transition to it.
- `cycle`: Each time a `cycle` node becomes active, it picks the next of its children in order
    (starting with the first, on the first activation). When all children have been picked, it 
    starts again.

## i18n

Any time a text is specified (`text` or `thenText` properties), there are two options:

- Using a string
- Using multiple strings, one per language

Multilingual strings are specified as objects, where the keys are language codes and the values are
the strings in that language.

```
{
  "text": {
    "en": "Hello!",
    "es": "¡Hola!"
    "de": "Hallo!"
  }
}
```

## Expressions

Expressions are used in `cond` properties. They can be used to check for one or more flags.

The following operators are supported:

- `&`: Logical AND
- `|`: Logical OR
- `^`: Logical NOT
- `=`: Equals
- `!=`: Not equals
- `<`: Less than
- `<=`: Less than or equal to
- `>`: Greater than
- `>=`: Greater than or equal to

The following functions are supported:

- `COUNT("prefix")`: Returns the number of flags (which are set, i.e. > 0) that start with `prefix`. 
  The prefix must be entered within quotes.

Parentheses can be used to group expressions.

Example:

```
flag1 | (^flag2 & flag3)
```

It's also possible to check flags used as counters

```
counter1 >= 3 | counter2 >= 2
```

## Flags

Flags are used to keep track of the player's progress. They can be used in `cond` and `set` properties.

In `cond` properties, flags can only be read. In `set` properties, flags's values can be changed 
in different ways:

- `flag`: If the flag is not set, it's set to 1. Otherwise, its value is not changed.
- `flag = 3`: Sets the flag to 3.
- `flag += n`: Adds n to the flag's value (where n is an integer literal).
- `flag -= n`: Subtracts n from the flag's value (where n is an integer literal).

The value of a flag can never be lower than 0 or higher than 999.

## Restrictions

### IDs must be unique

Node IDs, and the ID of the dialogue itself, must be unique within a dialogue.

### Cycles are forbidden

A dialogue can't have cycles. That is, there cannot be a path from a node to itself through 
`then` properties. Even though cycles could be designed in a way that avoids infinite loops,
they are not allowed because the risk of having one by mistake is too high.
