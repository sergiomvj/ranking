"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { injectTasksIntoProject } from "../../lib/tasks/markdownParser";

export async function createProjectAction(formData: FormData) {
  const name = formData.get("name") as string;
  const documentation = formData.get("documentation") as string;
  const tasklist = formData.get("tasklist") as string;

  if (!name || !tasklist) {
    throw new Error("Name and Tasklist are required");
  }

  const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 20) + "_" + Date.now();

  const project = await prisma.project.create({
    data: {
      name,
      code,
      documentation,
      status: "active",
      // MVP: We assume macro-admin is the creator
    }
  });

  await injectTasksIntoProject(project.id, tasklist);

  revalidatePath("/task-center");
}

export async function updateProjectDocAction(projectId: string, newDoc: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { documentation: newDoc }
  });
  revalidatePath(`/task-center`);
  revalidatePath(`/task-center/project/${projectId}`);
}

export async function addProjectMemberAction(projectId: string, agentId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        connect: { id: agentId }
      }
    }
  });
  revalidatePath(`/task-center/project/${projectId}`);
}

export async function removeProjectMemberAction(projectId: string, agentId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        disconnect: { id: agentId }
      }
    }
  });
  revalidatePath(`/task-center/project/${projectId}`);
}

export async function deleteProjectAction(projectId: string) {
  await prisma.project.delete({
    where: { id: projectId }
  });
  revalidatePath("/task-center");
}

export async function getAllProjectsWithTasks() {
  return await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tasks: {
        include: {
          assignedAgent: true,
          assignedTeam: true,
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}
