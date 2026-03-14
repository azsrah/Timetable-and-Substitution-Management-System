import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableGrid = ({ 
  periods, 
  timetableData, 
  onSlotClick, 
  isEditMode = false,
  highlightConflictedSlots = [] 
}) => {
  if (!periods || periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="text-gray-400 text-lg font-medium">No periods defined.</div>
        <p className="text-gray-500 text-sm mt-1">Please configure periods in the administration panel.</p>
      </div>
    );
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
            <th className="px-2 py-3 w-24 font-bold text-gray-600 uppercase tracking-wider text-[10px] border-r bg-gray-100/30">
              Time
            </th>
            {DAYS.map(day => (
              <th key={day} className="px-1 py-3 text-center font-bold text-gray-700 uppercase tracking-wider text-[10px] border-r last:border-r-0">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {periods.map(period => (
            <tr key={period.id} className="group hover:bg-gray-50/40 transition-colors">
              <td className="px-2 py-3 font-medium text-gray-900 border-r bg-gray-50/20">
                <div className="text-[11px] font-bold text-indigo-900 leading-tight">{period.name}</div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">
                  {period.start_time.substring(0,5)}—{period.end_time.substring(0,5)}
                </div>
              </td>
              
              {period.is_break ? (
                <td colSpan={DAYS.length} className="px-2 py-3 text-center bg-stripes-gray bg-gray-50/80 border-r last:border-r-0">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-1 rounded-full border border-gray-100">
                    Break
                  </span>
                </td>
              ) : (
                DAYS.map(day => {
                  const slot = dataMap[day][period.id];
                  const isConflicted = highlightConflictedSlots.includes(slot?.id);

                  return (
                    <td 
                      key={`${day}-${period.id}`} 
                      className={`h-24 p-1 border-r last:border-r-0 align-top ${
                        isEditMode ? 'cursor-pointer hover:bg-indigo-50/30' : ''
                      }`}
                      onClick={() => onSlotClick && isEditMode ? onSlotClick(day, period, slot) : null}
                    >
                      {slot ? (
                        <div className={`h-full w-full rounded-md p-1.5 flex flex-col justify-between border shadow-sm ${
                          slot.is_locked 
                            ? 'bg-gray-50 border-gray-100 text-gray-400' 
                            : 'bg-white border-indigo-50'
                        } ${isConflicted ? 'ring-1 ring-red-500 border-transparent bg-red-50' : ''}`}>
                          <div className="overflow-hidden">
                            <div className="font-bold text-indigo-950 leading-tight text-[10px] line-clamp-2">
                              {slot.subject_name}
                            </div>
                            <div className={`text-[9px] mt-0.5 truncate ${slot.substitute_teacher ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                              {slot.substitute_teacher || slot.teacher_name}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {slot.substitute_teacher && (
                              <span className="text-[7px] bg-amber-50 text-amber-700 px-1 py-0 rounded border border-amber-100 font-black">SUB</span>
                            )}
                            {slot.resource_name && (
                              <span className="text-[7px] bg-indigo-50 text-indigo-700 px-1 py-0 rounded border border-indigo-100 truncate font-bold">
                                {slot.resource_name}
                              </span>
                            )}
                            {slot.is_double_period === 1 && (
                              <span className="text-[7px] bg-indigo-600 text-white px-1 py-0 rounded font-bold">2P</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full w-full border border-dashed border-gray-100 rounded-md flex items-center justify-center ${
                          isEditMode ? 'hover:border-indigo-200 hover:bg-slate-50' : ''
                        }`}>
                          {isEditMode ? <span className="text-gray-200 font-bold text-xs">+</span> : null}
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
