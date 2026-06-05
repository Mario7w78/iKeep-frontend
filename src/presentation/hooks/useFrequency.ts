import { useState, useCallback } from 'react';
import { DayOfWeek } from '../../domain/entities/Activity';
import { DayConfig } from '../../domain/entities/activity.types';
import { frequencyProps, editGroupProps } from './props';

export default function useFrequency() {
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
    const [daysDict, setDaysDict] = useState<Partial<Record<DayOfWeek, DayConfig>>>({});
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [nextGroupId, setNextGroupId] = useState(0);


    const getGroups = () => {
        const groups: Record<number, { days: DayOfWeek[]; config: DayConfig }> = {};
        (Object.entries(daysDict) as [DayOfWeek, DayConfig][]).forEach(([day, cfg]) => {
            if (!groups[cfg.groupId]) {
                groups[cfg.groupId] = { days: [], config: cfg };
            }
            groups[cfg.groupId].days.push(day);
        });
        return groups;
    };

    const handleUpdateFrequency = ({ partitions }: frequencyProps) => {
        if (selectedDays.length === 0) return;
        const groupId = editingGroupId !== null ? editingGroupId : nextGroupId;

        const config: DayConfig = {
            partitions,
            groupId,
        };

        setDaysDict(prev => {
            const next = { ...prev };

            if (editingGroupId !== null) {
                (Object.keys(next) as DayOfWeek[]).forEach(day => {
                    if (next[day]?.groupId === editingGroupId) delete next[day];
                });
            }

            selectedDays.forEach(day => { next[day] = config; });
            return next;
        });

        if (editingGroupId === null) {
            setNextGroupId(prev => prev + 1);
        }

        setEditingGroupId(null);
        setSelectedDays([]);
    };

    const handleEditGroup = ({groupId, days, config, setPartitions, setActivePartitionIndex}: editGroupProps) => {
        setPartitions(config.partitions);
        setActivePartitionIndex(0);
        setSelectedDays(days);
        setEditingGroupId(groupId);
    };

    const handleSelect = (val: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleDiscardGroup = (groupId: number) => {
        setDaysDict(prev => {
            const next = { ...prev };
            (Object.keys(next) as DayOfWeek[]).forEach(day => {
                if (next[day]?.groupId === groupId) delete next[day];
            });
            return next;
        });
        if (editingGroupId === groupId) {
            setEditingGroupId(null);
            setSelectedDays([]);
        }
    };

    const decoupleDay = useCallback((day: DayOfWeek) => {
        setDaysDict(prev => {
            const config = prev[day];
            if (!config) return prev;

            // Count how many days share this groupId
            const groupDays = (Object.keys(prev) as DayOfWeek[]).filter(
                d => prev[d]?.groupId === config.groupId
            );

            if (groupDays.length <= 1) return prev; // Already decoupled or unique

            const newGroupId = nextGroupId;
            setNextGroupId(p => p + 1);

            return {
                ...prev,
                [day]: {
                    ...config,
                    groupId: newGroupId,
                    partitions: config.partitions.map(p => ({ ...p })), // clone partitions
                }
            };
        });
    }, [nextGroupId]);

    const isDayConfigured = (day: DayOfWeek) => !!daysDict[day];
    const groups = getGroups();

    return {
        selectedDays,
        daysDict,
        nextGroupId,
        editingGroupId,
        groups,
        setSelectedDays,
        setDaysDict,
        setNextGroupId,
        setEditingGroupId,
        handleUpdateFrequency,
        handleEditGroup,
        handleDiscardGroup,
        handleSelect,
        isDayConfigured,
        decoupleDay,
    };
}