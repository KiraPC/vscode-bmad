---
name: "test-menu-agent"
description: "Test Agent with Menu"
---

Test agent file with complete menu section.

<agent id="test-menu" name="MenuBot" title="Menu Test Agent" icon="📋">
  <menu>
    <item cmd="T1 or fuzzy match on test-one" workflow="/path/to/workflow.yaml">[T1] Test One: First test command</item>
    <item cmd="T2 or fuzzy match on test-two" exec="/path/to/exec.md">[T2] Test Two: Second test command</item>
    <item cmd="T3 or fuzzy match on test-three" data="/path/to/data.csv">[T3] Test Three: Third test command</item>
    <item cmd="T4 or fuzzy match on test-four">[T4] Test Four: No attributes</item>
    <item cmd="MH or fuzzy match on menu">[MH] Menu Help: Display this menu</item>
    <item cmd="LONG or fuzzy match on longer-code">[LONG] Longer Code: Four character code</item>
  </menu>
</agent>
