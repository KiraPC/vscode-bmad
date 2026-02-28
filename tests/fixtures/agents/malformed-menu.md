---
name: "malformed-menu-agent"
description: "Agent with malformed menu XML"
---

This agent has a malformed menu section.

<agent id="malformed-menu" name="MalformedBot" title="Malformed Menu Agent" icon="⚠️">
  <menu>
    <item cmd="T1">[T1] Valid Item</item>
    <item>Missing cmd attribute and code</item>
    <item cmd="T2">No bracket code here</item>
    <item cmd="T3">[T3] Valid item again</item>
  </menu>
</agent>
