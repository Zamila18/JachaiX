#!/bin/bash
for pid in $(ls /proc | grep -E '^[0-9]+$'); do
  cmdline=$(cat /proc/$pid/cmdline 2>/dev/null | tr '\0' ' ')
  if echo "$cmdline" | grep -q "queue:work"; then
    echo "killing $pid: $cmdline"
    kill $pid 2>/dev/null
  fi
done
echo "all done"
