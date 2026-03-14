import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TimetableGrid = ({ 
  periods, 
  timetableData, 
  onSlotClick, 
  isEditMode = false,
  highlightConflictedSlots = [] 
}) => {
  if (!periods || periods.length === 0) {
    return <div className="p-4 text-center text-gray-500">No periods defined.</div>;
  }

  // Group data by day and period: dataMap[day][periodId] = slotData
  const dataMap = {};
  DAYS.forEach(day => {
    dataMap[day] = {};
    if (timetableData) {
      timetableData.forEach(slot => {
        const slotDay = slot.day_of_week.charAt(0).toUpperCase() + slot.day_of_week.slice(1).toLowerCase();
        if (slotDay === day) {
          dataMap[day][slot.period_id] = slot;
        }
      });
    }
  });

  return (
    <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-xl">
      <table className="w-full text-sm text-left text-gray-500 bg-white table-fixed min-w-[800px]">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 w-32 border-r bg-gray-100/50">Time \\ Day</th>
            {DAYS.map(day => (
              <th key={day} className="px-4 py-3 text-center border-r w-40">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map(period => (
            <tr key={period.id} className="border-b last:border-0 hover:bg-gray-50/20">
              <td className="px-4 py-3 font-medium text-gray-900 border-r bg-gray-50/30 whitespace-nowrap">
                <div className="text-sm">{period.name}</div>
                <div className="text-xs text-gray-400 font-normal">
                  {period.start_time.substring(0,5)} - {period.end_time.substring(0,5)}
                </div>
              </td>
              
              {period.is_break ? (
                // Break Row Span
                <td colSpan={DAYS.length} className="px-4 py-3 text-center bg-gray-100 font-semibold text-gray-500 tracking-widest uppercase">
                  Break
                </td>
              ) : (
                DAYS.map(day => {
                  const slot = dataMap[day][period.id];
                  const isConflicted = highlightConflictedSlots.includes(slot?.id);

                  return (
                    <td 
                      key={`${day}-${period.id}`} 
                      className={`h-24 p-2 border-r align-top transition-colors ${
                        isEditMode ? 'cursor-pointer hover:bg-indigo-50/50' : ''
                      } ${isConflicted ? 'bg-red-50 ring-1 ring-inset ring-red-400' : ''}`}
                      onClick={() => onSlotClick && isEditMode ? onSlotClick(day, period, slot) : null}
                    >
                      {slot ? (
                        <div className={`h-full w-full rounded-md p-2 flex flex-col justify-between relative ${slot.is_locked ? 'bg-gray-100 border-l-4 border-gray-400' : 'bg-indigo-50 border-l-4 border-indigo-400'}`}>
                          <div>
                            <div className="font-semibold text-indigo-900 line-clamp-1">{slot.subject_name}</div>
                            <div className={`text-xs line-clamp-1 ${slot.substitute_teacher ? 'text-amber-700 font-bold' : 'text-gray-600'}`}>
                              {slot.substitute_teacher || slot.teacher_name}
                            </div>
                            {slot.substitute_teacher && (
                              <div className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter mt-0.5">Substituted</div>
                            )}
                          </div>
                          {slot.resource_name && (
                            <div className="mt-1 text-[10px] font-medium bg-white px-1 py-0.5 rounded text-indigo-600 truncate border border-indigo-100">
                              {slot.resource_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs hover:border-indigo-300">
                          {isEditMode ? '+ Add' : '-'}
                        </div>
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
