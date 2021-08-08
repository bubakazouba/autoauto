#!/bin/zsh

IFS=$'\n'
for i in $(cat req);
do
	poetry add $i;
done
