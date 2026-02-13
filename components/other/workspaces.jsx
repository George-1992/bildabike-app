'use client';
import { useState, useEffect } from "react";

import { Dropdown } from "@/components/other/dropdown";
import { BuildingIcon, ChevronsUpDownIcon, ListChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/libs/utils";

export default function Workspaces({ session, user, account, isCollapsed = false, workspace, workspaces = [] }) {
    // console.log('workspace ==> ', workspace);
    // console.log('workspaces ==> ', workspaces);

    const w = workspace || workspaces?.[0] || null;
    const [_workspace, _setWorkspace] = useState(w);

    const getAllWorkspaces = () => {
        // exclude selected workspace from the list
        if (!workspaces) {
            return [];
        }
        if (workspaces && _workspace && _workspace.id) {
            return workspaces.filter(o => o.id !== _workspace.id);
        }
        return workspaces;
    };

    const handleWorkspaceChange = (newWorkspaceId) => {
        const newWorkspace = workspaces.find(o => o.id === newWorkspaceId);
        if (newWorkspace) {
            _setWorkspace(newWorkspace);
        }
    };

    const handleAddNewWorkspace = () => {
        // redirect to workspace creation page
        // window.location.href = '/workspaces/create';
    }


    return (
        <Dropdown fixed={true} align="right" className="w-full py-2" buttonClassName="w-full">
            <div
                data-type="trigger"
                className={cn(
                    'w-full h-14 flex gap-1 items-center justify-between text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors',
                    isCollapsed ? 'justify-center' : 'p-2'
                )}
            >
                <div className="flex gap-2 items-center justify-center">
                    <BuildingIcon className="size-5" />
                    <span className={isCollapsed ? 'hidden' : ''}>
                        {_workspace && _workspace.name ? _workspace.name : 'No Workspace'}
                    </span>
                </div>

                {!isCollapsed && <ChevronsUpDownIcon className="size-4" />}
            </div>
            <div data-type="content" className="w-64 right-0">
                <div className="py-1">
                    {
                        getAllWorkspaces().length === 0 &&
                        <div className="px-4 py-2 text-sm text-gray-500">
                            No other workspaces available.
                        </div>
                    }
                    {
                        getAllWorkspaces().length > 0 && getAllWorkspaces().map((o) => (
                            <button
                                key={o.id}
                                onClick={() => handleWorkspaceChange(o.id)}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {o.name}
                            </button>
                        ))
                    }

                    {/* separator */}
                    <div className="border-t border-gray-200 my-1"></div>
                    {/* add new workspace */}
                    <div className="px-4 py-2">
                        <button
                            onClick={handleAddNewWorkspace}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            <PlusIcon className="size-4" />
                            <span>Create New Workspace</span>
                        </button>
                    </div>
                </div>
            </div>
        </Dropdown>
    );
}