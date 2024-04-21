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

- **id**: (string) The node's id. If it's not set, it's generated automatically.
- **type**: (string, default: 'statement') The node's type. Can be 'statement', 'random', 'cycle', or
  'sequence'.

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

- `cond` (string, optional): A logical expression (see below).
- `text` (string | object, required): The text to display.
- `class` (string | array, optional): One or more classes that are set when the text is displayed.
- `set` (string | array, optional): One or more flags that are set when the node becomes active.
- `responses` (array, optional): An array of response objects.
- `then` (string, optional): The ID of the next node to transition to.

A statement node can only become active if its `cond` is true. When it becomes active, it
sets all of its `set` flags. 

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

### Random nodes

Example:

```json
{
  "id": "node_id",
  "type": "random",
  "items": [
    
  ]
}
```

Random nodes have these properties:

- `items` (array, required): An array of node objects.

When a random node becomes active, it randomly picks one of its child `items` and transitions to it.

### Cycle nodes

Example:

```json
{
  "id": "node_id",
  "type": "cycle",
  "items": [
    
  ]
}
```

Cycle nodes have these properties:

- `items` (array, required): An array of node objects.

When a cycle node becomes active, it picks the first elegible one of its child `items` and 
transitions to it. Child items become elegible in order starting with the first, and once all of 
them have been picked, the cycle starts again.

### Sequence nodes

Example:

```json
{
  "id": "node_id",
  "type": "sequence",
  "items": [
    
  ]
}
```

Sequence nodes have these properties:

- `items` (array, required): An array of node objects.
- `cond` (string, optional): A logical expression (see below).
- `set` (string | array, optional): One or more flags that are set when the response is selected.


When a sequence node becomes active, it goes through all of its child `items` in order. Sequence nodes
can even be nested.

### First nodes
    
```json
  {
    "id": "node_id",
    "type": "first",
    "items": [
        
    ]
  }
```

First nodes have these properties:

- `items` (array, required): An array of node objects.
- `cond` (string, optional): A logical expression (see below).
- `set` (string | array, optional): One or more flags that are set when the response is selected.

When a first node becomes active, it continues to the first of its child `items` that is valid 
(its `cond` property is true).

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
