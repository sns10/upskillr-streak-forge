
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, CheckCircle, ArrowRight } from "lucide-react";

interface Assignment {
  id: string;
  problem_statement: string;
  created_at: string;
}

interface AssignmentSelectorProps {
  assignments: Assignment[];
  completedAssignments: Set<string>;
  onSelectAssignment: (assignment: Assignment) => void;
  onBack: () => void;
  lesson: any;
}

export const AssignmentSelector = ({ 
  assignments, 
  completedAssignments, 
  onSelectAssignment, 
  onBack, 
  lesson 
}: AssignmentSelectorProps) => {
  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to Lessons
      </Button>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {lesson.title}
        </h2>
        <p className="text-gray-600">Choose an assignment to work on</p>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment, index) => {
          const isCompleted = completedAssignments.has(assignment.id);
          
          return (
            <Card
              key={assignment.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectAssignment(assignment)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Assignment {index + 1}
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {assignment.problem_statement.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}
                    <Button variant="outline">
                      {isCompleted ? "Review" : "Start"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Complete all {assignments.length} assignments to finish this lesson and earn {lesson.xp_reward} XP and {lesson.bits_reward} bits!
        </p>
        <div className="mt-2">
          <div className="flex gap-2">
            <Badge variant="outline">
              {completedAssignments.size} of {assignments.length} completed
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
