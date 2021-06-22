#!/bin/sh

{
  yarn release
  git push --follow-tags origin master
  npm publish ./release
} || echo "It seems this version has been released previously."
